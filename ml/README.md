# Tradexcel assistant: ML pipeline

This folder trains and evaluates the models behind the in-app assistant. It covers three jobs:

- **Retrieval:** pick the knowledge-base card that answers a question.
- **Intent classification:** decide whether the question needs a card, live data (a price, your portfolio), or a polite refusal.
- **Stock-name linking:** recognise which listed stocks a message mentions.

Everything runs on CPU. The trained models are served from the Node backend, so nothing here runs in production.

## Data

The knowledge base is hand-written YAML in [`apps/backend/chat/kb`](../apps/backend/chat/kb). It has 142 answer cards, the intent templates, stock aliases, and two held-out test sets. It's validated by `pnpm --filter @tradexcel/backend chat:validate`, which also checks that no test question leaks into training. The pipeline reads a JSON snapshot of it:

```bash
pnpm --filter @tradexcel/backend chat:export   # -> ml/data/kb_export.json
```

## Setup

```bash
cd ml
python3 -m venv .venv
.venv/bin/pip install torch --index-url https://download.pytorch.org/whl/cpu
.venv/bin/pip install -r requirements.txt
```

## Run

```bash
.venv/bin/python -m pytest                        # splits, metrics, linker, router, guard rules
.venv/bin/python -m tradexcel_ml.baselines        # P2 baselines -> reports/baselines.md
.venv/bin/python -m tradexcel_ml.finetune minilm  # P3 contrastive fine-tuning (also: bge)
.venv/bin/python -m tradexcel_ml.evaluate         # pretrained vs fine-tuned + full router -> reports/finetune.md
.venv/bin/python -m tradexcel_ml.export_onnx      # ONNX + INT8 + parity gate -> artifacts/export/, reports/export.md
```

## Reports

- [Baselines (P2)](reports/baselines.md): keyword search, TF-IDF and off-the-shelf embedding models. This is the bar the fine-tuned models have to beat.
- [Fine-tuning and the full router (P3)](reports/finetune.md): pretrained vs fine-tuned encoders, the complete answer policy, learning curves, and the remaining failures.
- [Export (P3)](reports/export.md): ONNX fp32 vs INT8 size, latency and parity. INT8 didn't pass the accuracy gate, so the runtime ships fp32.
- [Model card](MODEL_CARD.md)
