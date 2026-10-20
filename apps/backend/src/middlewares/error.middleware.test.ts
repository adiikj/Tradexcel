import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";
import type { ErrorRequestHandler } from "express";
import { ApiError } from "../utils/ApiError.js";

// The handler logs every failure; keep the test output readable.
vi.mock("../utils/logger.js", () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), fatal: vi.fn() },
}));

const { errorHandler } = await import("./error.middleware.js");

type Captured = { status: number; body: Record<string, unknown> };

// Runs the handler against a fake request/response and returns what it sent.
function run(error: unknown): Captured {
  const captured = { status: 0, body: {} } as Captured;
  const res = {
    status(code: number) {
      captured.status = code;
      return res;
    },
    json(body: Record<string, unknown>) {
      captured.body = body;
      return res;
    },
  };
  const req = { path: "/test" };
  (errorHandler as ErrorRequestHandler)(error, req as never, res as never, vi.fn());
  return captured;
}

beforeEach(() => vi.clearAllMocks());

describe("errorHandler", () => {
  it("passes an ApiError's status and message through", () => {
    const { status, body } = run(new ApiError(400, "That stock isn't listed."));
    expect(status).toBe(400);
    expect(body.message).toBe("That stock isn't listed.");
    expect(body.success).toBe(false);
  });

  it("maps a unique-constraint violation to a conflict", () => {
    const err = new Prisma.PrismaClientKnownRequestError("unique", { code: "P2002", clientVersion: "6" });
    const { status, body } = run(err);
    expect(status).toBe(409);
    expect(body.message).toBe("That already exists.");
  });

  it("maps a missing record to a not found", () => {
    const err = new Prisma.PrismaClientKnownRequestError("not found", { code: "P2025", clientVersion: "6" });
    const { status, body } = run(err);
    expect(status).toBe(404);
    expect(body.message).toBe("We couldn't find that.");
  });

  it("maps a transaction conflict to a retryable conflict", () => {
    const err = new Prisma.PrismaClientKnownRequestError("conflict", { code: "P2034", clientVersion: "6" });
    const { status, body } = run(err);
    expect(status).toBe(409);
    expect(body.message).toBe("That clashed with another request. Please try again.");
  });

  it("maps an unknown Prisma code to a server error without leaking it", () => {
    const err = new Prisma.PrismaClientKnownRequestError("boom", { code: "P9999", clientVersion: "6" });
    const { status, body } = run(err);
    expect(status).toBe(500);
    expect(body.message).not.toContain("boom");
  });

  it("maps an invalid query to a bad request", () => {
    const err = new Prisma.PrismaClientValidationError("bad query", { clientVersion: "6" });
    const { status, body } = run(err);
    expect(status).toBe(400);
    expect(body.message).toBe("We couldn't read that request.");
  });

  it("maps an unreachable database to a temporary failure", () => {
    const err = new Prisma.PrismaClientInitializationError("cannot reach", "6", "P1001");
    const { status, body } = run(err);
    expect(status).toBe(503);
    expect(body.message).toContain("try again");
  });

  it("never leaks the internal message of an unknown error", () => {
    const { status, body } = run(new Error("connect ECONNREFUSED 10.0.0.1:5432"));
    expect(status).toBe(500);
    expect(body.message).toBe("Something went wrong on our side. Please try again in a moment.");
    expect(JSON.stringify(body)).not.toContain("ECONNREFUSED");
  });

  it("always answers with the same JSON shape", () => {
    const { body } = run(new ApiError(404, "That endpoint doesn't exist."));
    expect(Object.keys(body).sort()).toEqual(["data", "errors", "message", "status", "success"]);
    expect(body.data).toBeNull();
    expect(body.errors).toEqual([]);
  });
});
