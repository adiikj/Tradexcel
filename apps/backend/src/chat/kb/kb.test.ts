import { describe, expect, it } from "vitest";
import { resolvePlaceholders } from "./facts.js";
import { loadKb, validateKb, listAppRoutes } from "./loadKb.js";
import { loadDatasets, validateDatasets } from "./datasets.js";
import type { KbCard } from "./schema.js";

describe("resolvePlaceholders", () => {
  it("fills facts and badges, and reports unknown names", () => {
    const facts = { STARTING_BALANCE: "₹1,00,000" };
    expect(resolvePlaceholders("Start with {{STARTING_BALANCE}}.", facts)).toEqual({ text: "Start with ₹1,00,000.", unknown: [] });
    expect(resolvePlaceholders("{{BADGE:first_trade}}").text).toContain("**First Trade**");
    expect(resolvePlaceholders("{{NOPE}} and {{BADGE:nope}}", facts).unknown).toEqual(["{{NOPE}}", "{{BADGE:nope}}"]);
  });
});

function card(overrides: Partial<KbCard>): KbCard {
  return {
    id: "a.b",
    category: "platform",
    intent: "faq_platform",
    title: "Title",
    answer: "An answer long enough.",
    questions: ["q one"],
    tags: [],
    links: [],
    related: [],
    hard_negatives: [],
    sources: ["exists.ts"],
    file: "test.yaml",
    ...overrides,
  };
}

const opts = { routes: [/^\/wallet$/, /^\/u\/[^/]+$/], fileExists: (p: string) => p === "exists.ts" };

describe("validateKb", () => {
  it("accepts valid links and references but catches near-duplicate questions", () => {
    const cards = [
      card({ id: "a.one", questions: ["How much?"], links: [{ label: "W", href: "/wallet#top" }], related: ["a.two"] }),
      card({ id: "a.two", questions: ["how much"], links: [{ label: "P", href: "/u/someone" }] }),
    ];
    // "How much?" and "how much" normalize to the same question.
    expect(validateKb(cards, opts)).toEqual([expect.stringContaining("duplicates one in a.one")]);
  });

  it("flags bad links, dangling references, duplicate ids and missing sources", () => {
    const errors = validateKb(
      [
        card({ id: "a.one", questions: ["x1"], links: [{ label: "L", href: "/nowhere" }], related: ["a.missing", "a.one"] }),
        card({ id: "a.one", questions: ["x2"], sources: [] }),
        card({ id: "a.three", questions: ["x3"], sources: ["gone.ts"] }),
      ],
      opts
    );
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("duplicate id"),
        expect.stringContaining("/nowhere is not a page"),
        expect.stringContaining("unknown card a.missing"),
        expect.stringContaining("references itself"),
        expect.stringContaining("must list sources"),
        expect.stringContaining("source gone.ts does not exist"),
      ])
    );
  });
});

describe("the real knowledge base", () => {
  it("finds the app's page routes", () => {
    const routes = listAppRoutes();
    expect(routes.some((r) => r.test("/wallet"))).toBe(true);
    expect(routes.some((r) => r.test("/u/anyone"))).toBe(true);
  });

  it("loads and validates cleanly", () => {
    const { cards, errors } = loadKb();
    expect(cards.length).toBeGreaterThan(0);
    expect([...errors, ...validateKb(cards)]).toEqual([]);
  });

  it("has consistent intents, stock aliases and leak-free eval sets", () => {
    const { cards } = loadKb();
    const { data, errors } = loadDatasets();
    expect(data.heldout.length).toBeGreaterThan(0);
    expect(data.entityCases.length).toBeGreaterThan(0);
    expect([...errors, ...validateDatasets(data, cards)]).toEqual([]);
  });

  it("rejects an eval case copied from the training questions", () => {
    const { cards } = loadKb();
    const { data } = loadDatasets();
    const leaked = { ...data, heldout: [{ text: cards[0].questions[0], expect: cards[0].id, style: "plain" as const }] };
    expect(validateDatasets(leaked, cards)).toEqual([expect.stringContaining("is also a training example")]);
  });
});
