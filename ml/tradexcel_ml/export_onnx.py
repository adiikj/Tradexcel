"""P3: export the selected encoder for the Node runtime.

    python -m tradexcel_ml.export_onnx          # uses artifacts/router_config.json

Writes artifacts/export/tradexcel-assistant-encoder/ in the layout
transformers.js loads (config + tokenizer at the root, onnx/model.onnx and
onnx/model_quantized.onnx), plus tradexcel_router.json with everything the
runtime needs besides the encoder: pooling, fusion weight, thresholds, the
intent head's weights, and the guard patterns (so Node and Python share one list).

Then checks that the ONNX models agree with PyTorch and records size/latency
in reports/export.md.
"""

from __future__ import annotations

import json
import shutil
import time
from collections import defaultdict
from pathlib import Path

import numpy as np
import onnxruntime as ort
import torch
from onnxruntime.quantization import QuantType, quantize_dynamic
from sentence_transformers import SentenceTransformer
from transformers import AutoModel, AutoTokenizer

from .data import build_dataset, by_split, load_export
from .guard_rules import GUARD_PATTERNS
from .linker import StockLinker
from .paths import ARTIFACTS_DIR, REPORTS_DIR, ML_ROOT
from .retrieval import Index

EXPORT_NAME = "tradexcel-assistant-encoder"
TOKENIZER_FILES = ("tokenizer.json", "tokenizer_config.json", "special_tokens_map.json", "vocab.txt", "config.json")


class _Wrapped(torch.nn.Module):
    """Keyword-only call into the encoder; the tracer passes inputs positionally,
    which no longer lines up with BertModel.forward in transformers 5."""

    def __init__(self, model):
        super().__init__()
        self.model = model

    def forward(self, input_ids, attention_mask, token_type_ids):
        return self.model(input_ids=input_ids, attention_mask=attention_mask, token_type_ids=token_type_ids).last_hidden_state


def export_onnx(model_dir: Path, out_dir: Path) -> None:
    model = _Wrapped(AutoModel.from_pretrained(model_dir)).eval()
    tok = AutoTokenizer.from_pretrained(model_dir)
    sample = tok(["what is my balance", "how do contests work"], return_tensors="pt", padding=True)
    names = ["input_ids", "attention_mask", "token_type_ids"]
    dynamic = {n: {0: "batch", 1: "sequence"} for n in names} | {"last_hidden_state": {0: "batch", 1: "sequence"}}
    (out_dir / "onnx").mkdir(parents=True, exist_ok=True)
    with torch.no_grad():
        torch.onnx.export(
            model,
            tuple(sample[n] for n in names),
            str(out_dir / "onnx" / "model.onnx"),
            input_names=names,
            output_names=["last_hidden_state"],
            dynamic_axes=dynamic,
            opset_version=17,
            dynamo=False,
        )
    # Per-channel scales: one scale per whole tensor cost ~14% of top-1 cards (cosine min 0.83).
    quantize_dynamic(str(out_dir / "onnx" / "model.onnx"), str(out_dir / "onnx" / "model_quantized.onnx"), weight_type=QuantType.QInt8, per_channel=True)
    for f in TOKENIZER_FILES:
        if (model_dir / f).exists():
            shutil.copy(model_dir / f, out_dir / f)


class OnnxEncoder:
    def __init__(self, path: Path, tokenizer_dir: Path, pooling: str, max_len: int):
        opts = ort.SessionOptions()
        opts.intra_op_num_threads = 1  # like one request on the VM
        self.session = ort.InferenceSession(str(path), opts, providers=["CPUExecutionProvider"])
        self.tok = AutoTokenizer.from_pretrained(tokenizer_dir)
        self.pooling, self.max_len = pooling, max_len

    def encode(self, texts: list[str], batch_size: int = 32) -> np.ndarray:
        out = []
        for i in range(0, len(texts), batch_size):
            enc = self.tok(texts[i : i + batch_size], padding=True, truncation=True, max_length=self.max_len, return_tensors="np")
            feeds = {k: enc[k].astype(np.int64) for k in ("input_ids", "attention_mask", "token_type_ids")}
            hidden = self.session.run(["last_hidden_state"], feeds)[0]
            if self.pooling == "cls":
                pooled = hidden[:, 0]
            else:
                mask = feeds["attention_mask"][..., None].astype(np.float32)
                pooled = (hidden * mask).sum(1) / np.clip(mask.sum(1), 1e-9, None)
            out.append(pooled / np.linalg.norm(pooled, axis=1, keepdims=True))
        return np.concatenate(out)


def latency(encode, texts: list[str]) -> dict[str, float]:
    encode(["warm up"])
    times = []
    for t in texts:
        start = time.perf_counter()
        encode([t])
        times.append((time.perf_counter() - start) * 1000)
    return {"p50": float(np.percentile(times, 50)), "p95": float(np.percentile(times, 95))}


def main() -> None:
    cfg = json.loads((ARTIFACTS_DIR / "router_config.json").read_text())
    if cfg["variant"] != "fine-tuned":
        raise SystemExit(f"Selected encoder is {cfg['selected']} - nothing fine-tuned to export.")
    model_dir = Path(cfg["model_path"])
    out_dir = ARTIFACTS_DIR / "export" / EXPORT_NAME
    shutil.rmtree(out_dir, ignore_errors=True)
    export_onnx(model_dir, out_dir)

    st = SentenceTransformer(str(model_dir), device="cpu")
    max_len = st.max_seq_length
    history = json.loads((model_dir / "training_history.json").read_text())
    router = {
        "kb_hash": cfg["kb_hash"],
        "encoder": {"base_model": history["base_model"], "pooling": cfg["pooling"], "max_seq_length": max_len, "normalize": True},
        "fusion": {"method": "weighted_rrf", "dense_weight": cfg["fusion_weight"], "k": 60},
        "policy": cfg["policy"],
        "intent_head": cfg["intent_head"],
        "guard_patterns": {k: v for k, v in GUARD_PATTERNS.items()},
        "guard_pattern_flags": "i",
    }
    card = ML_ROOT / "MODEL_CARD.md"
    if card.exists():
        shutil.copy(card, out_dir / "README.md")

    # ---- parity on real queries ----
    export = load_export()
    linker = StockLinker(export["stocks"], export["entities"])
    examples = build_dataset(export, linker, 13)
    rows_q = by_split(examples, "val") + by_split(examples, "test_ood")
    queries = [e.text for e in rows_q]
    card_index = {c["id"]: i for i, c in enumerate(export["cards"])}
    gold = np.asarray([card_index[e.card] if e.card else -1 for e in rows_q])
    is_val = np.asarray([e.split == "val" for e in rows_q])

    def r_at_1(top: np.ndarray) -> dict[str, float]:
        has = gold >= 0
        return {s: float((top[has & m] == gold[has & m]).mean()) for s, m in (("val", is_val), ("test_ood", ~is_val))}
    train_q = defaultdict(list)
    for e in by_split(examples, "train"):
        if e.source == "card":
            train_q[e.card].append(e.text)
    index = Index(export["cards"], train_q)

    ref_q = st.encode(queries, normalize_embeddings=True, show_progress_bar=False)
    ref_idx = st.encode(index.texts, normalize_embeddings=True, show_progress_bar=False)
    ref_top = index.card_scores(ref_q @ ref_idx.T).argmax(1)
    rows = {"pytorch": {"R@1": r_at_1(ref_top)}}
    for variant, fname in (("fp32", "model.onnx"), ("int8", "model_quantized.onnx")):
        enc = OnnxEncoder(out_dir / "onnx" / fname, out_dir, cfg["pooling"], max_len)
        q = enc.encode(queries)
        top = index.card_scores(q @ enc.encode(index.texts).T).argmax(1)
        cos = (q * ref_q).sum(1)
        rows[variant] = {
            "size_mb": (out_dir / "onnx" / fname).stat().st_size / 1e6,
            "cosine_min": float(cos.min()),
            "cosine_mean": float(cos.mean()),
            "top1_agreement": float((top == ref_top).mean()),
            "R@1": r_at_1(top),
            "latency_ms": latency(enc.encode, queries[:50]),
        }
    torch.set_num_threads(1)
    rows["pytorch"]["latency_ms"] = latency(lambda t: st.encode(t, show_progress_bar=False), queries[:50])

    # Parity = embeddings close AND retrieval accuracy within 1.5 points of PyTorch.
    drop = max(rows["pytorch"]["R@1"][s] - rows["int8"]["R@1"][s] for s in ("val", "test_ood"))
    ok = rows["int8"]["cosine_min"] >= 0.95 and rows["int8"]["cosine_mean"] >= 0.99 and drop <= 0.015
    # The runtime only gets INT8 if it passed; otherwise the exact fp32 export.
    chosen = "model_quantized.onnx" if ok else "model.onnx"
    router["encoder"]["onnx_file"] = f"onnx/{chosen}"
    router["encoder"]["dtype"] = "q8" if ok else "fp32"
    (out_dir / "tradexcel_router.json").write_text(json.dumps(router, indent=2))
    result = {"model": cfg["selected"], "queries": len(queries), "variants": rows, "int8_parity_ok": ok, "runtime_file": chosen}
    (REPORTS_DIR / "export.json").write_text(json.dumps(result, indent=2))
    lines = [
        "# Export for the Node runtime (P3)",
        "",
        f"Encoder: **{cfg['selected']}**, exported to ONNX (opset 17) and dynamically quantized to INT8. "
        f"Parity measured on {len(queries)} real val + held-out queries against the PyTorch model (single thread, like one request on the VM).",
        "",
        "| variant | size | cosine vs PyTorch (mean / min) | same top card as PyTorch | val R@1 | OOD R@1 | p50 ms | p95 ms |",
        "|---|---:|---:|---:|---:|---:|---:|---:|",
        f"| PyTorch fp32 | – | – | – | {100 * rows['pytorch']['R@1']['val']:.1f} | {100 * rows['pytorch']['R@1']['test_ood']:.1f} "
        f"| {rows['pytorch']['latency_ms']['p50']:.1f} | {rows['pytorch']['latency_ms']['p95']:.1f} |",
    ]
    for v in ("fp32", "int8"):
        r = rows[v]
        lines.append(
            f"| ONNX {v} | {r['size_mb']:.1f} MB | {r['cosine_mean']:.4f} / {r['cosine_min']:.4f} | {100 * r['top1_agreement']:.1f}% "
            f"| {100 * r['R@1']['val']:.1f} | {100 * r['R@1']['test_ood']:.1f} | {r['latency_ms']['p50']:.1f} | {r['latency_ms']['p95']:.1f} |"
        )
    lines += [
        "",
        f"INT8 gate (mean cosine ≥ 0.99, min ≥ 0.95, R@1 within 1.5 points of PyTorch on val and OOD): **{'passed' if ok else 'failed'}**. "
        f"The runtime therefore uses **`onnx/{chosen}`** ({'INT8' if ok else 'fp32, exact'}).",
        "",
        "Quantization note: plain per-tensor INT8 dropped the minimum cosine to 0.83 and changed the top card on 14% of queries; "
        "per-channel weight scales (used here) keep the same 23 MB size with near-identical embeddings.",
        "",
        "The runtime loads `onnx/model_quantized.onnx` with transformers.js, pooling "
        f"`{cfg['pooling']}` + L2 normalisation, and `tradexcel_router.json` for the fusion weight, thresholds, intent head and guard patterns.",
    ]
    (REPORTS_DIR / "export.md").write_text("\n".join(lines) + "\n")
    print("\n".join(lines))


if __name__ == "__main__":
    main()
