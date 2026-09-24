import type { ZodError } from "zod";
import { ApiError } from "./ApiError.js";

export const GENERIC_VALIDATION_MESSAGE = "Please check the details you entered and try again.";

// Zod's built-in messages ("Invalid input: expected string, received
// undefined", "Too small: expected string to have >=3 characters") describe the
// schema, not the problem, so they never reach users. Messages written in our
// own schemas ("username must be at least 3 characters") do.
const BUILT_IN = /^(invalid|too (small|big)|expected|unrecognized|required)\b/i;

export function userMessageFromIssues(issues: { message: string }[]): string {
  const message = issues[0]?.message?.trim();
  if (!message || BUILT_IN.test(message)) return GENERIC_VALIDATION_MESSAGE;
  const sentence = message.charAt(0).toUpperCase() + message.slice(1);
  return /[.!?]$/.test(sentence) ? sentence : `${sentence}.`;
}

// A 400 carrying one plain-language sentence. The raw issues stay on the
// server; clients only ever see the message.
export function validationError(error: ZodError): ApiError {
  return new ApiError(400, userMessageFromIssues(error.issues));
}
