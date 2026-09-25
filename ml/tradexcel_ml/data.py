"""Turns the exported knowledge base into train / val / test splits.

Splits (all deterministic given the seed):
- Card questions: per card, ~70% train / 15% val / 15% test. Train questions
  are what the retriever indexes; val is for tuning; test is in-distribution.
- Intent examples: split the same way, per intent.
- Intent templates: split *by template*, then filled with stock names, so test
  sentences come from templates the model never saw.
- ood_dev: the first hand-written held-out set (different styles). It was
  looked at during P3, so it's now used for tuning the style-shift fixes.
- test_ood: heldout_v2, written before the improvement round and only scored
  at the end.
"""

from __future__ import annotations

import hashlib
import json
import random
from dataclasses import dataclass, field
from pathlib import Path

from .linker import StockLinker, normalize
from .paths import EXPORT_PATH

SPLITS = ("train", "val", "test")


@dataclass(frozen=True)
class Example:
    text: str
    intent: str
    card: str | None  # target card for card-backed examples
    split: str  # train / val / test / test_ood
    source: str  # card / example / template / heldout
    style: str | None = None
    stocks: tuple[str, ...] = field(default=())
    template: str | None = None  # the intent template a filled example came from


def load_export(path: Path = EXPORT_PATH) -> dict:
    if not path.exists():
        raise FileNotFoundError(f"{path} not found - run `pnpm --filter @tradexcel/backend chat:export` first")
    return json.loads(path.read_text())


def _rng(seed: int, key: str) -> random.Random:
    # Per-item RNG so adding a card doesn't reshuffle every other card's split.
    digest = hashlib.sha256(f"{seed}:{key}".encode()).hexdigest()
    return random.Random(int(digest[:16], 16))


def three_way_split(items: list, seed: int, key: str, val: float = 0.15, test: float = 0.15) -> dict[str, list]:
    items = list(items)
    _rng(seed, key).shuffle(items)
    n = len(items)
    n_test = max(1, round(n * test)) if n >= 3 else 0
    n_val = max(1, round(n * val)) if n >= 3 else 0
    return {"test": items[:n_test], "val": items[n_test : n_test + n_val], "train": items[n_test + n_val :]}


def card_examples(export: dict, seed: int) -> list[Example]:
    out = []
    for card in export["cards"]:
        for split, qs in three_way_split(card["questions"], seed, card["id"]).items():
            out += [Example(q, card["intent"], card["id"], split, "card") for q in qs]
    return out


def fill_template(template: str, forms: list[tuple[str, str]], rng: random.Random) -> tuple[str, tuple[str, ...]]:
    picks = rng.sample(forms, 2)
    text, stocks = template, []
    for slot, (form, symbol) in zip(("{stock}", "{stock2}"), picks):
        if slot in text:
            if rng.random() < 0.25:
                form = form.upper() if len(form) <= 6 else form.title()
            text = text.replace(slot, form)
            stocks.append(symbol)
    return text, tuple(stocks)


def intent_examples(export: dict, linker: StockLinker, seed: int, fills_per_template: int = 6) -> list[Example]:
    # Unambiguous names only; everyday-word stocks would teach wrong slot values.
    skip = set(export["entities"]["common_words"])
    forms = [(f, s["symbol"]) for s in export["stocks"] if s["symbol"] not in skip for f in linker.surface_forms(s["symbol"])]
    card_questions = {" ".join(normalize(q)) for c in export["cards"] for q in c["questions"]}

    out = []
    for intent in export["intents"]:
        for split, exs in three_way_split(intent["examples"], seed, f"ex:{intent['id']}").items():
            out += [Example(e, intent["id"], None, split, "example") for e in exs]
        for split, templates in three_way_split(intent["templates"], seed, f"tpl:{intent['id']}").items():
            for t in templates:
                rng = _rng(seed, f"fill:{intent['id']}:{t}")
                seen = set()
                for _ in range(fills_per_template):
                    text, stocks = fill_template(t, forms, rng)
                    key = " ".join(normalize(text))
                    if key in seen or key in card_questions:
                        continue
                    seen.add(key)
                    out.append(Example(text, intent["id"], None, split, "template", stocks=stocks, template=t))
    return out


def heldout_examples(export: dict) -> list[Example]:
    card_intent = {c["id"]: c["intent"] for c in export["cards"]}
    out = []
    for case in export["heldout"]:
        expect = case["expect"]
        if expect.startswith("intent:"):
            intent, card = expect[len("intent:") :], None
        else:
            intent, card = card_intent[expect], expect
        split = "ood_dev" if case["role"] == "dev" else "test_ood"
        out.append(Example(case["text"], intent, card, split, "heldout", case["style"], tuple(case.get("stocks") or ())))
    return out


def build_dataset(export: dict, linker: StockLinker, seed: int) -> list[Example]:
    return card_examples(export, seed) + intent_examples(export, linker, seed) + heldout_examples(export)


def by_split(examples: list[Example], split: str) -> list[Example]:
    return [e for e in examples if e.split == split]
