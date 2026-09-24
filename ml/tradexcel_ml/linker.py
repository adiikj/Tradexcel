"""Rule-based stock-name linker: finds which listed stocks a message mentions.

Deliberately not learned - with 258 known names, a gazetteer plus fuzzy
matching is more accurate and explainable than a trained NER model, and it
ports to the Node runtime line for line. It's evaluated like a model anyway.

Matching, left to right, longest first:
1. exact surface forms (symbol, short name, full name and its unique prefixes, aliases)
2. fuzzy match on one or two tokens, for typos ("infosis", "tata stell")
3. ambiguous words ("tata", "hdfc") - flagged, with an optional default
Everyday words that are also stock names ("idea", "oil") only count when
written in caps or next to a cue like "share" or "stock".
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

from rapidfuzz import fuzz

CUES = {"share", "shares", "stock", "stocks", "ltp", "quote", "price", "nse"}
# After an ambiguous word, these mean "the company as a whole" rather than a
# different, unlisted company ("tata share" vs "tata motors").
AMBIGUOUS_NEXT_OK = CUES | {"prices", "today", "doing", "now", "up", "down", "and", "or", "vs", "is", "was", "trading", "group", "chart", "news"}
STOPWORDS = {
    "a", "an", "the", "of", "and", "or", "in", "on", "at", "for", "to", "is", "it", "my", "me", "i", "vs",
    "what", "whats", "how", "why", "when", "which", "do", "does", "did", "today", "now", "price", "prices",
}
# Never fuzzy-match these onto a stock name.
FUZZY_SKIP = STOPWORDS | CUES | {
    "trend", "trade", "trading", "market", "markets", "bank", "banks", "power", "doing", "profit", "balance",
    "portfolio", "gainers", "losers", "falling", "rising", "shares", "stocks", "india", "indian", "company",
    "limited", "sensex", "nifty", "hello", "should", "would", "could", "about", "there", "their", "where",
    "alert", "alerts", "order", "orders", "holding", "holdings", "chart", "latest", "compare", "quote",
}
NAME_SUFFIXES = {"limited", "ltd", "company", "co", "corporation", "corp", "enterprise"}
FUZZY_CUTOFF = 85
MIN_FUZZY_LEN = 5


def normalize(text: str) -> list[str]:
    text = text.lower()
    text = re.sub(r"'s\b", "", text)
    text = text.replace("'", "").replace(".", " ")
    text = re.sub(r"[^a-z0-9&]+", " ", text)
    return text.split()


@dataclass
class LinkResult:
    symbols: list[str] = field(default_factory=list)
    ambiguous: list[str] = field(default_factory=list)


class StockLinker:
    def __init__(self, stocks: list[dict], entities: dict):
        self.forms: dict[tuple[str, ...], str] = {}
        self.common_symbols = set(entities["common_words"])
        # Single-token everyday-word forms of those symbols ("idea", "oil").
        self.common_forms: set[tuple[str, ...]] = set()
        self.ambiguous: dict[tuple[str, ...], dict] = {
            tuple(normalize(a["term"])): a for a in entities["ambiguous"]
        }

        def add(form: str, symbol: str) -> None:
            key = tuple(normalize(form))
            if key and key not in self.ambiguous:
                self.forms.setdefault(key, symbol)

        prefix_owner: dict[tuple[str, ...], set[str]] = {}
        for s in stocks:
            symbol = s["symbol"]
            base = symbol.rsplit(".", 1)[0]
            full = re.sub(r"\(.*?\)", " ", s["fullName"])
            for form in (base, s["shortName"], full):
                add(form, symbol)
            for inner in re.findall(r"\((.*?)\)", s["fullName"]):
                add(inner, symbol)
            tokens = normalize(full)
            while tokens and tokens[-1] in NAME_SUFFIXES:
                tokens = tokens[:-1]
                add(" ".join(tokens), symbol)
            for n in range(2, len(tokens)):
                if tokens[n - 1] not in STOPWORDS:
                    prefix_owner.setdefault(tuple(tokens[:n]), set()).add(symbol)
            if symbol in self.common_symbols:
                for form in (base, s["shortName"]):
                    key = tuple(normalize(form))
                    if len(key) == 1:
                        self.common_forms.add(key)
        # Prefixes like "sun pharmaceutical" or "prestige estates", when only one company has them.
        for prefix, owners in prefix_owner.items():
            if len(owners) == 1 and prefix not in self.forms and prefix not in self.ambiguous:
                self.forms[prefix] = next(iter(owners))
        for symbol, aliases in entities["aliases"].items():
            for alias in aliases:
                add(alias, symbol)

        self.max_len = max(len(k) for k in self.forms)
        self.fuzzy_forms = {" ".join(k): v for k, v in self.forms.items() if len(k) <= 2 and len(" ".join(k)) >= MIN_FUZZY_LEN}

    def _has_cue(self, tokens: list[str], start: int, end: int) -> bool:
        window = tokens[max(0, start - 2) : start] + tokens[end : end + 2]
        return any(t in CUES for t in window)

    def _fuzzy(self, phrase: str) -> str | None:
        best, best_score = None, FUZZY_CUTOFF - 1
        for form, symbol in self.fuzzy_forms.items():
            if abs(len(form) - len(phrase)) > 3:
                continue
            score = fuzz.ratio(phrase, form)
            if score > best_score:
                best, best_score = symbol, score
        return best

    def link(self, text: str) -> LinkResult:
        tokens = normalize(text)
        upper_words = {w.lower() for w in re.findall(r"\b[A-Z]{2,}\b", text)}
        result = LinkResult()

        def emit(symbol: str) -> None:
            if symbol not in result.symbols:
                result.symbols.append(symbol)

        i = 0
        while i < len(tokens):
            matched = False
            for n in range(min(self.max_len, len(tokens) - i), 0, -1):
                key = tuple(tokens[i : i + n])
                symbol = self.forms.get(key)
                if symbol is None:
                    continue
                if key in self.common_forms and key[0] not in upper_words and not self._has_cue(tokens, i, i + n):
                    break  # everyday word, not a stock here
                emit(symbol)
                i += n
                matched = True
                break
            if matched:
                continue

            amb = self.ambiguous.get((tokens[i],))
            # Typos: two tokens first ("tata stell"), then one ("infosis") -
            # but never fuzz an ambiguous word itself ("godrej" isn't "godrejcp").
            for n in ((2,) if amb else (2, 1)):
                if i + n > len(tokens):
                    continue
                span = tokens[i : i + n]
                if any(t in FUZZY_SKIP for t in span) or len(span[-1]) < 3:
                    continue
                phrase = " ".join(span)
                if len(phrase) < MIN_FUZZY_LEN:
                    continue
                symbol = self._fuzzy(phrase)
                if symbol and not (symbol in self.common_symbols and not self._has_cue(tokens, i, i + n)):
                    emit(symbol)
                    i += n
                    matched = True
                    break
            if matched:
                continue

            if amb is not None:
                nxt = tokens[i + 1] if i + 1 < len(tokens) else None
                if nxt is None or nxt in AMBIGUOUS_NEXT_OK:
                    if amb["term"] not in result.ambiguous:
                        result.ambiguous.append(amb["term"])
                    if amb.get("default"):
                        emit(amb["default"])
                # Otherwise it's another company from the same group that isn't listed.
            i += 1
        return result

    def surface_forms(self, symbol: str) -> list[str]:
        """Every exact form that links to `symbol`, for filling intent templates."""
        return sorted({" ".join(k) for k, v in self.forms.items() if v == symbol})
