import { describe, expect, it } from "vitest";
import { z } from "zod";
import { GENERIC_VALIDATION_MESSAGE, userMessageFromIssues, validationError } from "./validation.js";

describe("userMessageFromIssues", () => {
  it("turns our own schema messages into a sentence", () => {
    expect(userMessageFromIssues([{ message: "username must be at least 3 characters" }])).toBe("Username must be at least 3 characters.");
    expect(userMessageFromIssues([{ message: "Please verify your email." }])).toBe("Please verify your email.");
  });

  it("hides zod's built-in technical messages", () => {
    const schema = z.object({ age: z.number(), name: z.string().min(3) });
    const age = schema.safeParse({ age: "x", name: "abcd" });
    const name = schema.safeParse({ age: 1, name: "a" });
    expect(age.success || userMessageFromIssues(age.error.issues)).toBe(GENERIC_VALIDATION_MESSAGE);
    expect(name.success || userMessageFromIssues(name.error.issues)).toBe(GENERIC_VALIDATION_MESSAGE);
    expect(userMessageFromIssues([])).toBe(GENERIC_VALIDATION_MESSAGE);
  });

  it("builds a 400 without the raw issues", () => {
    const parsed = z.object({ pin: z.string().regex(/^\d{4}$/, "pin must be exactly 4 digits") }).safeParse({ pin: "12" });
    if (parsed.success) throw new Error("expected failure");
    const err = validationError(parsed.error);
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe("Pin must be exactly 4 digits.");
    expect(err.errors).toEqual([]);
  });
});
