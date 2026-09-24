"""Sentence encoders with an in-memory cache, so each text is embedded once per
model no matter how many experiments reuse it."""

from __future__ import annotations

import gc

import numpy as np


class Encoder:
    def __init__(self, model_name: str, batch_size: int = 64):
        from sentence_transformers import SentenceTransformer

        self.name = model_name
        self.model = SentenceTransformer(model_name, device="cpu")
        self.batch_size = batch_size
        self._cache: dict[str, np.ndarray] = {}

    def encode(self, texts: list[str]) -> np.ndarray:
        missing = [t for t in dict.fromkeys(texts) if t not in self._cache]
        if missing:
            vecs = self.model.encode(missing, batch_size=self.batch_size, normalize_embeddings=True, show_progress_bar=False)
            self._cache.update(zip(missing, vecs))
        return np.stack([self._cache[t] for t in texts])

    def close(self) -> None:
        # The box this runs on has ~1 GB free; free each model before loading the next.
        del self.model
        self._cache.clear()
        gc.collect()
