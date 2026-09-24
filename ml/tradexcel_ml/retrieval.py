"""Card retrievers. Each one scores a query against every indexed string (card
titles + train questions) and a card's score is its best-matching string."""

from __future__ import annotations

import re

import numpy as np
from rank_bm25 import BM25Okapi
from sklearn.feature_extraction.text import TfidfVectorizer

from .encoders import Encoder


def tokenize(text: str) -> list[str]:
    return re.findall(r"[a-z0-9&%]+", text.lower())


def plain_answer(markdown: str) -> str:
    text = re.sub(r"[*_`#>]", "", markdown)
    return re.sub(r"\s+", " ", re.sub(r"^\s*(-|\d+\.)\s+", "", text, flags=re.M)).strip()


class Index:
    """The strings a retriever searches, each mapped back to its card: the
    title, tags and answer text (what the runtime indexes too) plus the card's
    *train* questions only."""

    def __init__(self, cards: list[dict], train_questions: dict[str, list[str]]):
        self.card_ids = [c["id"] for c in cards]
        self.texts: list[str] = []
        owner: list[int] = []
        for i, card in enumerate(cards):
            meta = [card["title"], plain_answer(card["answer"])] + ([", ".join(card["tags"])] if card["tags"] else [])
            for text in [*meta, *train_questions.get(card["id"], [])]:
                self.texts.append(text)
                owner.append(i)
        self.owner = np.asarray(owner)

    def card_scores(self, string_scores: np.ndarray) -> np.ndarray:
        """[n_queries, n_strings] -> [n_queries, n_cards], max per card."""
        out = np.full((string_scores.shape[0], len(self.card_ids)), -np.inf)
        for j in range(len(self.card_ids)):
            out[:, j] = string_scores[:, self.owner == j].max(axis=1)
        return out


class BM25Retriever:
    name = "BM25"

    def __init__(self, index: Index):
        self.index = index
        self.bm25 = BM25Okapi([tokenize(t) for t in index.texts])

    def score(self, queries: list[str]) -> np.ndarray:
        return self.index.card_scores(np.stack([self.bm25.get_scores(tokenize(q)) for q in queries]))


class TfidfRetriever:
    """Character n-grams: crude, but naturally tolerant of typos."""

    name = "TF-IDF (char 3-5)"

    def __init__(self, index: Index):
        self.index = index
        self.vec = TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5), sublinear_tf=True)
        self.matrix = self.vec.fit_transform(index.texts)

    def score(self, queries: list[str]) -> np.ndarray:
        return self.index.card_scores((self.vec.transform(queries) @ self.matrix.T).toarray())


class DenseRetriever:
    def __init__(self, index: Index, encoder: Encoder, label: str):
        self.index = index
        self.encoder = encoder
        self.name = label
        self.matrix = encoder.encode(index.texts)

    def score(self, queries: list[str]) -> np.ndarray:
        return self.index.card_scores(self.encoder.encode(queries) @ self.matrix.T)


def ranks_of(scores: np.ndarray, gold: list[int]) -> list[int]:
    """1-based rank of each gold card (ties broken pessimistically)."""
    target = scores[np.arange(len(gold)), gold]
    return [int((row > t).sum() + 1) for row, t in zip(scores, target)]


def rrf(score_matrices: list[np.ndarray], k: int = 60) -> np.ndarray:
    """Reciprocal rank fusion: sum of 1/(k + rank) across retrievers."""
    fused = np.zeros_like(score_matrices[0])
    for scores in score_matrices:
        order = np.argsort(-scores, axis=1)
        ranks = np.empty_like(order)
        rows = np.arange(scores.shape[0])[:, None]
        ranks[rows, order] = np.arange(1, scores.shape[1] + 1)
        fused += 1.0 / (k + ranks)
    return fused
