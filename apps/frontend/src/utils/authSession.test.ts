import { afterEach, describe, expect, it } from "vitest";
import { postLoginPath } from "./authSession";

function visit(search: string) {
  window.history.replaceState(null, "", `/signin${search}`);
}

describe("postLoginPath", () => {
  afterEach(() => visit(""));

  it("returns to the page the proxy bounced the user from", () => {
    visit("?next=%2Fmarket%3Fsymbol%3DTCS");
    expect(postLoginPath()).toBe("/market?symbol=TCS");
  });

  it("defaults to the dashboard", () => {
    expect(postLoginPath()).toBe("/dashboard");
  });

  it.each(["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)"])(
    "refuses off-site target %s",
    (next) => {
      visit(`?next=${encodeURIComponent(next)}`);
      expect(postLoginPath()).toBe("/dashboard");
    }
  );
});
