// @vitest-environment node
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "./proxy";

function request(path: string, loggedIn: boolean, admin = false) {
  const req = new NextRequest(`http://localhost:3000${path}`);
  if (loggedIn) req.cookies.set("tx_session", "1");
  if (admin) req.cookies.set("tx_admin", "1");
  return proxy(req);
}

describe("proxy", () => {
  it("sends logged-out visitors of app pages to sign in, keeping where they were", () => {
    const res = request("/market?symbol=TCS", false);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/signin?next=%2Fmarket%3Fsymbol%3DTCS");
  });

  it("covers nested app routes", () => {
    expect(request("/contest/abc", false).headers.get("location")).toContain("/signin?next=%2Fcontest%2Fabc");
  });

  it("lets logged-in users through to app pages", () => {
    expect(request("/dashboard", true).headers.get("location")).toBeNull();
  });

  it.each(["/", "/signin", "/signup"])("skips %s for logged-in users", (path) => {
    expect(request(path, true).headers.get("location")).toBe("http://localhost:3000/dashboard");
  });

  it("leaves public pages alone", () => {
    expect(request("/", false).headers.get("location")).toBeNull();
    expect(request("/signin", false).headers.get("location")).toBeNull();
  });

  it("guards the admin panel with its own session", () => {
    expect(request("/admin/contests", true).headers.get("location")).toBe("http://localhost:3000/admin/login");
    expect(request("/admin", false).headers.get("location")).toBe("http://localhost:3000/admin/login");
    expect(request("/admin/contests", false, true).headers.get("location")).toBeNull();
    expect(request("/admin/login", false).headers.get("location")).toBeNull();
    expect(request("/admin/login", false, true).headers.get("location")).toBe("http://localhost:3000/admin/contests");
  });
});
