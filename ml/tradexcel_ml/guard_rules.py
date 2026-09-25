"""Deterministic guardrail patterns, checked before the classifier.

The classifier alone can't be trusted to catch 100% of advice-seeking or
credential-sharing messages, so these high-precision patterns run first. They
were written from the training guardrail questions, general phrasing and the
dev set's misses; the locked test set is never looked at. The runtime (Node) ports this list as-is.
"""

from __future__ import annotations

import re

GUARD_PATTERNS: dict[str, list[str]] = {
    # "should i buy X", "should i dump my adani shares", "buy or sell infosys"
    "advice": [
        r"\bshould (i|we) (buy|sell|dump|exit|invest in|add|average|book)\b",
        r"\b(buy|sell) or (sell|hold|buy)\s+[a-z]+",
        r"\b(which|what|best|top|good) (stock|stocks|share|shares|penny stock)s? (should|to buy|will|would|for me)\b",
        r"\b(recommend|suggest)\b.*\b(stock|stocks|share|shares)\b",
        r"\b(give|send|any) me (a |some )?(stock )?(tip|tips|pick|picks)\b",
        r"\b(stock|share) (tip|tips|pick|picks|recommendation)s?\b",
        r"\bgood time to (start )?(buy|sell|invest)",
        r"\b(good|bad|worth) (investment|buy)\b",
        r"\brate .* (out of|as an investment)\b",
        r"\bif you (had to|were me)\b.*\b(pick|buy|choose|invest)\b",
        r"\btell me what to (buy|sell)\b",
        r"\b(intraday|btst) (call|tip)s?\b",
        r"\b(one|a|any|some) (good )?stocks? (to|i should) buy\b",
        r"\btop picks?\b",
    ],
    # "will reliance go up", "tcs target price for...", "sure shot"
    "prediction": [
        r"\bwill .* (go up|go down|rise|fall|crash|hit|reach|recover|close at|be next)\b",
        r"\bwhat will .* (price|be)\b",
        r"\b(is|are) .* going to (crash|rise|fall|go up|go down|recover)\b",
        r"\b(predict|prediction|forecast)s?\b",
        r"\btarget price (for|of|next|in|by)\b",
        r"\b(guarantee|guaranteed|sure[- ]?shot|100 ?% (sure|profit)|jackpot|multibagger|get rich)\b",
        r"\bwhere will (the )?(nifty|sensex|market)\b",
        r"\b(double|triple|10x) (my|your|the) money (in (a|one|\d+) (day|week|month)s?|fast|quick|quickly|overnight)\b",
    ],
    "real_money": [
        r"\b(which|best) (broker|demat|trading app)\b",
        r"\b(invest|put) my (savings|salary|lakhs?)\b",
        r"\bwhere should i (put|invest)\b",
        r"\bplan my (investments?|finances)\b",
        r"\btake a loan\b",
    ],
    "tax": [
        r"\b(capital gains?|stcg|ltcg|income tax)\b",
        r"\bhow much tax\b",
        r"\b(file|pay|save) (my )?tax(es)?\b",
        r"\btax(es)? (on|for) (stock|share|trading|profit|selling|dividend)",
    ],
    "insider": [r"\b(insider (info|information|tip|tips|news)|operator stock|telegram (tips?|group)|whatsapp tip)\b"],
    "credentials": [
        # Only when an actual secret is typed (something with a digit in it).
        r"\b(password|pin|otp|code)\s*(is|:)\s*\S*\d\S*",
        r"\bhere(?:'s| is) my (password|pin|otp)\b",
        r"\b(share|give|send) (you |them )?(my )?(password|otp|pin|verification code)\b",
        r"\b(asked|asks|asking|wants?|wanted|needs?) (me )?(for )?my (password|otp|pin|cvv|verification code)\b",
        r"\blog ?in as me\b",
    ],
    "cheating": [
        r"\b(hack|cheat|exploit|glitch)\b",
        r"\bmultiple accounts\b",
        r"\binfinite (cash|money)\b",
        r"\bsomeone else'?s account\b",
        r"\btrick to win\b",
        r"\b(bug|loophole)\b.*\b(free|extra|unlimited) (cash|money|coins)\b",
        r"\bspam (trades|orders)\b",
    ],
}

_COMPILED = [(kind, re.compile(p, re.IGNORECASE)) for kind, ps in GUARD_PATTERNS.items() for p in ps]


def guard_match(text: str) -> str | None:
    """The guardrail kind a message trips, or None."""
    for kind, pattern in _COMPILED:
        if pattern.search(text):
            return kind
    return None
