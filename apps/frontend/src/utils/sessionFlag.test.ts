import { describe, expect, it } from "vitest";
import { clearSession, hasSession, markSession } from "./sessionFlag";

describe("session flag", () => {
  it("round-trips through a frontend cookie the proxy can read", () => {
    expect(hasSession()).toBe(false);
    markSession();
    expect(hasSession()).toBe(true);
    expect(document.cookie).toContain("tx_session=1");
    clearSession();
    expect(hasSession()).toBe(false);
  });

  it("clears tokens stored by older builds", () => {
    localStorage.setItem("authToken", "old-jwt");
    clearSession();
    expect(localStorage.getItem("authToken")).toBeNull();
  });
});
