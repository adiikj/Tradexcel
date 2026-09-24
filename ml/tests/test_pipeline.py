import pytest

from tradexcel_ml import metrics
from tradexcel_ml.data import build_dataset, by_split, load_export, three_way_split
from tradexcel_ml.linker import LinkResult, StockLinker, normalize


@pytest.fixture(scope="module")
def export():
    return load_export()


@pytest.fixture(scope="module")
def linker(export):
    return StockLinker(export["stocks"], export["entities"])


@pytest.fixture(scope="module")
def dataset(export, linker):
    return build_dataset(export, linker, seed=13)


def test_three_way_split_is_deterministic_and_disjoint():
    items = [f"q{i}" for i in range(20)]
    a = three_way_split(items, 1, "card")
    assert a == three_way_split(items, 1, "card")
    assert a != three_way_split(items, 2, "card")
    assert sorted(a["train"] + a["val"] + a["test"]) == sorted(items)
    assert len(a["test"]) == 3 and len(a["val"]) == 3


def test_every_card_keeps_questions_in_train(dataset, export):
    train_cards = {e.card for e in by_split(dataset, "train") if e.source == "card"}
    assert train_cards == {c["id"] for c in export["cards"]}


def test_no_text_appears_in_two_splits(dataset):
    seen = {}
    for e in dataset:
        key = " ".join(normalize(e.text))
        if key in seen:
            assert seen[key] == e.split, f"{e.text!r} is in {seen[key]} and {e.split}"
        seen[key] = e.split


def test_templates_are_split_before_filling(dataset):
    # A test sentence must never come from a template that also produced training sentences.
    splits_by_template = {}
    for e in dataset:
        if e.source == "template":
            splits_by_template.setdefault((e.intent, e.template), set()).add(e.split)
    assert splits_by_template
    for (intent, template), splits in splits_by_template.items():
        assert len(splits) == 1, f"{intent} template {template!r} used in {splits}"


def test_filled_templates_name_real_stocks(dataset, export):
    symbols = {s["symbol"] for s in export["stocks"]}
    filled = [e for e in dataset if e.source == "template"]
    assert filled and all(e.stocks and set(e.stocks) <= symbols for e in filled)


def test_retrieval_metrics():
    m = metrics.retrieval_metrics([1, 2, 5, 10])
    assert m["R@1"] == 0.25 and m["R@3"] == 0.5 and m["R@5"] == 0.75
    assert m["MRR"] == pytest.approx((1 + 0.5 + 0.2 + 0.1) / 4)


def test_classification_metrics():
    m = metrics.classification_metrics(["a", "a", "b", "b"], ["a", "b", "b", "b"])
    assert m["accuracy"] == 0.75
    assert m["per_class"]["a"]["recall"] == 0.5 and m["per_class"]["b"]["precision"] == pytest.approx(2 / 3)


def test_linker_metrics_counts_ambiguity():
    cases = [{"stocks": ["A"], "ambiguous": "x"}, {"stocks": []}]
    preds = [LinkResult(["A"], ["x"]), LinkResult(["B"], [])]
    m = metrics.linker_metrics(cases, preds)
    assert m["exact_match"] == 0.5 and m["precision"] == 0.5 and m["recall"] == 1.0


@pytest.mark.parametrize(
    "text, symbols, ambiguous",
    [
        ("tcs vs infosys", ["TCS.NS", "INFY.NS"], []),
        ("kotak mahindra bank today", ["KOTAKBANK.NS"], []),  # longest match beats "mahindra"
        ("tata share price", [], ["tata"]),
        ("tata motors price", [], []),  # unlisted, not ambiguous
        ("hdfc price", ["HDFCBANK.NS"], ["hdfc"]),  # ambiguous with a default
        ("i have an idea for my portfolio", [], []),  # everyday word
        ("IDEA share price", ["IDEA.NS"], []),
        ("infosis price", ["INFY.NS"], []),  # typo
        ("what is a trend", [], []),  # must not fuzz onto TRENT
        ("godrej stock", [], ["godrej"]),  # ambiguous word, not a typo of GODREJCP
    ],
)
def test_linker_cases(linker, text, symbols, ambiguous):
    got = linker.link(text)
    assert (got.symbols, got.ambiguous) == (symbols, ambiguous)
