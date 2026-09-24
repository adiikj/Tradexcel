# Export for the Node runtime (P3)

Encoder: **MiniLM-L6 (fine-tuned)**, exported to ONNX (opset 17) and dynamically quantized to INT8. Parity measured on 547 real val + held-out queries against the PyTorch model (single thread, like one request on the VM).

| variant | size | cosine vs PyTorch (mean / min) | same top card as PyTorch | val R@1 | OOD R@1 | p50 ms | p95 ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| PyTorch fp32 | – | – | – | 66.7 | 77.3 | 13.5 | 14.7 |
| ONNX fp32 | 90.4 MB | 1.0000 / 1.0000 | 100.0% | 66.7 | 77.3 | 5.8 | 7.2 |
| ONNX int8 | 23.0 MB | 0.9928 / 0.9759 | 92.0% | 62.2 | 78.5 | 3.0 | 4.3 |

INT8 gate (mean cosine ≥ 0.99, min ≥ 0.95, R@1 within 1.5 points of PyTorch on val and OOD): **failed**. The runtime therefore uses **`onnx/model.onnx`** (fp32, exact).

Quantization note: plain per-tensor INT8 dropped the minimum cosine to 0.83 and changed the top card on 14% of queries; per-channel weight scales (used here) keep the same 23 MB size with near-identical embeddings.

The runtime loads `onnx/model_quantized.onnx` with transformers.js, pooling `mean` + L2 normalisation, and `tradexcel_router.json` for the fusion weight, thresholds, intent head and guard patterns.
