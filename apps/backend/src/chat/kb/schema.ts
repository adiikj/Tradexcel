import { z } from "zod";

// Knowledge-base cards: one self-contained answer each, plus the paraphrased
// questions that should retrieve it. The YAML under apps/backend/chat/kb is
// the single source of truth - the Python training pipeline (ml/) and the Node
// runtime both read it.

export const CATEGORIES = ["platform", "account", "unsupported", "education", "guardrail", "smalltalk"] as const;
export type Category = (typeof CATEGORIES)[number];

// Categories whose answers state facts about the product; every one of those
// cards must cite the code it was written from.
export const FACTUAL_CATEGORIES: readonly Category[] = ["platform", "account", "unsupported"];

// The intent a card's questions are labelled with in the classifier dataset.
export const CATEGORY_INTENT = {
  platform: "faq_platform",
  account: "faq_platform",
  unsupported: "faq_platform",
  education: "faq_education",
  guardrail: "guardrail",
  smalltalk: "smalltalk",
} as const satisfies Record<Category, string>;

const linkSchema = z
  .object({
    label: z.string().trim().min(1).max(40),
    href: z.string().startsWith("/", "links must be in-app paths"),
  })
  .strict();

export const cardSchema = z
  .object({
    id: z.string().regex(/^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/, "id must look like area.topic"),
    category: z.enum(CATEGORIES),
    title: z.string().trim().min(3).max(80),
    answer: z.string().trim().min(20).max(900),
    questions: z.array(z.string().trim().min(2).max(200)).min(8).max(25),
    tags: z.array(z.string().trim().min(1)).default([]),
    links: z.array(linkSchema).max(3).default([]),
    related: z.array(z.string()).max(4).default([]),
    // Cards that look similar but answer a different question - used as hard
    // negatives when fine-tuning the retriever.
    hard_negatives: z.array(z.string()).default([]),
    // Repo-relative files the answer's facts come from.
    sources: z.array(z.string()).default([]),
  })
  .strict();

export const cardFileSchema = z.object({ cards: z.array(cardSchema).min(1) }).strict();

export type Card = z.infer<typeof cardSchema>;
export type KbCard = Card & { file: string; intent: (typeof CATEGORY_INTENT)[Category] };
