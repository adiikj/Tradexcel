"""Reference outputs for the Node port of the linker and guard rules.

    python -m tradexcel_ml.parity_fixtures

Writes apps/backend/src/chat/runtime/__fixtures__/parity.json: for every
question in the knowledge base and eval sets, what the Python linker and guard
rules return. The backend's vitest suite checks its TypeScript port against it.
"""

from __future__ import annotations

import json

from .data import load_export
from .guard_rules import GUARD_PATTERNS, guard_match
from .linker import StockLinker
from .paths import REPO_ROOT

OUT = REPO_ROOT / "apps/backend/src/chat/runtime/__fixtures__/parity.json"


def main() -> None:
    export = load_export()
    linker = StockLinker(export["stocks"], export["entities"])
    texts = [q for c in export["cards"] for q in c["questions"]]
    texts += [e for i in export["intents"] for e in i["examples"] + i["templates"]]
    texts += [c["text"] for c in export["heldout"]] + [c["text"] for c in export["entity_cases"]]
    texts = list(dict.fromkeys(texts))
    cases = []
    for t in texts:
        r = linker.link(t)
        cases.append({"text": t, "symbols": r.symbols, "ambiguous": r.ambiguous, "guard": guard_match(t)})
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"kb_hash": export["kb_hash"], "guard_patterns": GUARD_PATTERNS, "cases": cases}, indent=1))
    print(f"wrote {len(cases)} cases to {OUT.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()
