---
language: en
license: apache-2.0
base_model: sentence-transformers/all-MiniLM-L6-v2
pipeline_tag: sentence-similarity
tags: [sentence-transformers, feature-extraction, onnx, transformers.js, faq-retrieval, intent-classification]
---

# TradeXcel assistant encoder

A 22M-parameter sentence encoder fine-tuned from [all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) to power the in-app assistant of **TradeXcel**, a gamified stock-trading simulator. One embedding of the user's message drives two jobs:

- **Retrieval**: find which of 142 help and education cards answers the message.
- **Intent classification**: a logistic-regression head sorts the message into 13 intents. Examples include "answer from a card", "look up a live price", "summarise my portfolio", "refuse: investment advice" and "out of scope".

No hosted LLM is involved. The model runs in Node.js through transformers.js on a 1 vCPU / 1 GB VM.

## Files

| file | what it is |
|---|---|
| `onnx/model.onnx` | fp32 ONNX export (opset 17). **Used by the runtime.** |
| `onnx/model_quantized.onnx` | per-channel INT8. It didn't pass the accuracy gate (−4.5 R@1 on val), so it's kept for reference only. |
| `tradexcel_router.json` | Runtime settings: mean pooling + L2 norm, fusion weight, router thresholds, intent-head weights, and the regex guard patterns. |
| `tokenizer.json`, `config.json` | Standard tokenizer and config. |

## Usage

In Node.js with [transformers.js](https://huggingface.co/docs/transformers.js):

```js
import { pipeline } from "@huggingface/transformers";

const embed = await pipeline("feature-extraction", "adiikj/tradexcel-assistant-encoder", { dtype: "fp32" });
const vectors = await embed(["how do contests work", "what's my rank"], { pooling: "mean", normalize: true });
// vectors.dims -> [2, 384]; compare with a dot product (cosine similarity)
```

To reproduce the full assistant, load `tradexcel_router.json` as well: apply the guard patterns, run the intent head (softmax of `coef · x + intercept`), then retrieve cards with the thresholds in `policy`.

## Training

- **Data:** synthetic and hand-written. There are 142 cards with 1,192 paraphrased questions, 9 live-data and off-topic intents with templates filled from 258 real NSE stock names, and 60 out-of-scope examples. Card questions are split 70/15/15 per card, and intent templates are split *by template* before filling.
- **Objective:** in-batch contrastive loss (InfoNCE, scale 20) plus one hard negative per anchor, re-mined every epoch from the model's own nearest wrong neighbours. Pairs from the same card or intent are **masked out of the negatives**, so paraphrases aren't pushed apart.
- **Setup:** AdamW, lr 3e-5, batch 32, 6 epochs with the best epoch (5) chosen on validation, 128 max tokens. It took 21 minutes on a 4-core laptop CPU.

## Evaluation

Test sets were never used for tuning. `test_ood` is a separately hand-written held-out set of 310 questions in 8 styles (terse, typos, rambling, formal, slang, adversarial, …).

| | pretrained | **fine-tuned** |
|---|---:|---:|
| Retrieval R@1: val / test / **OOD** | 62.2 / 63.5 / **77.3** | 66.7 / 69.2 / **77.3** |
| Intent macro-F1: val / test / **OOD** | 70.1 / 71.6 / **73.8** | 82.5 / 78.5 / **76.5** |
| Full router on OOD: correct / helpful* / wrong | 53.2 / 72.9 / 17.4 | **63.9 / 80.6 / 16.5** |
| Full router on OOD: refusal recall | 85.0 | **95.0** |

\*"Helpful" means the right answer, or a "did you mean…?" prompt that offers it.

For comparison, keyword search (BM25) reaches 65.7 R@1 on OOD, and fine-tuned bge-small (33M parameters) scores similarly but runs 2× slower. See `ml/reports/` in the repo for the full tables, learning curves and failure lists.

On one CPU thread, ONNX fp32 encodes a query in 5.7 ms p50, versus 13.5 ms for PyTorch.

## Limitations

- **Everything is synthetic** and written by one author, so scores run high. Fine-tuning improved the same-distribution splits much more than the style-shifted OOD set: retrieval on OOD didn't improve. Real user questions will be the next test set.
- **The refusal classifier isn't perfect** (95% on OOD). In the product it sits behind deterministic regex guards and fixed refusal cards, and it never produces free text.
- **English only**, and specific to TradeXcel's content. It isn't a general-purpose encoder.
- **It never gives investment advice.** Refusals are canned responses.
