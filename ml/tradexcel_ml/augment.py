"""Train-only text augmentation for the style gap.

P3 showed the model does well on phrasing like its training questions and
worse on terse, typo-ridden, casual or wordy messages. These cheap rewrites
put those styles into training. They never touch dev/test data: any variant
that collides with a held-out question, or with another label's training text,
is dropped.
"""

from __future__ import annotations

import random
import re

from .linker import normalize

LEADING = re.compile(
    r"^(how (do|can|would|should) (i|we|you)|how to|what (is|are|does|do)|what's|whats|where (is|are|can i|do i)|"
    r"can (i|you)|is (it|there)|do (i|you)|why (is|does|did|do)|when (is|does|do)|which|tell me|explain|please)\b\s*"
)
STOP = {"a", "an", "the", "to", "of", "is", "are", "do", "does", "i", "me", "for", "on", "in", "it", "can", "will", "be", "there"}
CASUAL = [(r"\byou\b", "u"), (r"\bare\b", "r"), (r"\bplease\b", "pls"), (r"\bwhat is\b", "whats"), (r"\bokay\b", "ok"), (r"\bthanks\b", "thx")]
PREFIXES = ["hey tex, ", "hi, ", "quick question: ", "so ", "umm ", "tex ", "hello, "]
SUFFIXES = [" please", " pls", "??", "?", " thanks", " asap", " quickly"]
POLITE = ["Could you tell me ", "Can you explain ", "I'd like to know ", "Please tell me "]


def terse(q: str, rng: random.Random) -> str | None:
    words = LEADING.sub("", q.lower().strip(" ?!.")).split()
    kept = [w for w in words if w not in STOP]
    return " ".join(kept) if len(kept) >= 1 else None


def typo(q: str, rng: random.Random) -> str | None:
    words = q.split()
    idx = [i for i, w in enumerate(words) if len(w) >= 5 and w.isalpha()]
    if not idx:
        return None
    i = rng.choice(idx)
    w = words[i]
    j = rng.randrange(1, len(w) - 1)
    kind = rng.choice(("swap", "drop", "double"))
    if kind == "swap":
        w = w[:j] + w[j + 1] + w[j] + w[j + 2 :]
    elif kind == "drop":
        w = w[:j] + w[j + 1 :]
    else:
        w = w[:j] + w[j] + w[j:]
    words[i] = w
    return " ".join(words)


def casual(q: str, rng: random.Random) -> str | None:
    t = re.sub(r"[?.!,']", "", q.lower())
    for pat, rep in CASUAL:
        t = re.sub(pat, rep, t)
    return t + rng.choice(["", "?", "??"])


def filler(q: str, rng: random.Random) -> str | None:
    return rng.choice(PREFIXES) + q + (rng.choice(SUFFIXES) if rng.random() < 0.5 else "")


def polite(q: str, rng: random.Random) -> str | None:
    core = LEADING.sub("", q.lower().strip(" ?!."))
    if not core or len(core.split()) < 2:
        return None
    return rng.choice(POLITE) + core + "?"


AUGMENTERS = {"terse": terse, "typo": typo, "casual": casual, "filler": filler, "polite": polite}


def augment_texts(text: str, rng: random.Random, per_example: int) -> list[tuple[str, str]]:
    """Up to `per_example` distinct (kind, variant) rewrites of `text`."""
    kinds = list(AUGMENTERS)
    rng.shuffle(kinds)
    out, seen = [], {" ".join(normalize(text))}
    for kind in kinds:
        v = AUGMENTERS[kind](text, rng)
        if not v:
            continue
        key = " ".join(normalize(v))
        if key and key not in seen:
            seen.add(key)
            out.append((kind, v))
        if len(out) >= per_example:
            break
    return out
