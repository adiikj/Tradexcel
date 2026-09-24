"""Intent classifier baselines: sparse features and frozen pretrained embeddings,
each with a linear model, plus a nearest-neighbour vote."""

from __future__ import annotations

from collections import Counter

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline, make_union
from sklearn.feature_extraction.text import TfidfVectorizer

from .encoders import Encoder


class TfidfLogReg:
    name = "TF-IDF (word+char) + LogReg"

    def __init__(self, seed: int):
        self.model = make_pipeline(
            make_union(
                TfidfVectorizer(analyzer="word", ngram_range=(1, 2), sublinear_tf=True),
                TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 5), sublinear_tf=True),
            ),
            LogisticRegression(max_iter=3000, C=10, class_weight="balanced", random_state=seed),
        )

    def fit(self, texts: list[str], labels: list[str]) -> "TfidfLogReg":
        self.model.fit(texts, labels)
        return self

    def predict(self, texts: list[str]) -> list[str]:
        return list(self.model.predict(texts))


class EmbeddingLogReg:
    def __init__(self, encoder: Encoder, label: str, seed: int):
        self.encoder = encoder
        self.name = f"{label} + LogReg"
        self.clf = LogisticRegression(max_iter=3000, C=10, class_weight="balanced", random_state=seed)

    def fit(self, texts: list[str], labels: list[str]) -> "EmbeddingLogReg":
        self.clf.fit(self.encoder.encode(texts), labels)
        return self

    def predict(self, texts: list[str]) -> list[str]:
        return list(self.clf.predict(self.encoder.encode(texts)))


class EmbeddingKNN:
    def __init__(self, encoder: Encoder, label: str, k: int = 5):
        self.encoder = encoder
        self.name = f"{label} + kNN (k={k})"
        self.k = k

    def fit(self, texts: list[str], labels: list[str]) -> "EmbeddingKNN":
        self.matrix = self.encoder.encode(texts)
        self.labels = np.asarray(labels)
        return self

    def predict(self, texts: list[str]) -> list[str]:
        sims = self.encoder.encode(texts) @ self.matrix.T
        top = np.argsort(-sims, axis=1)[:, : self.k]
        out = []
        for row, idx in zip(sims, top):
            votes = Counter()
            for j in idx:
                votes[self.labels[j]] += float(row[j])
            out.append(votes.most_common(1)[0][0])
        return out
