import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import http, { apiErrorMessage, MESSAGES } from "./http";
import { hasSession, markSession } from "../utils/sessionFlag";

// Fake transport: each URL answers with the next status in its queue.
function useFakeServer(routes: Record<string, number[]>) {
  const calls: string[] = [];
  http.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const url = config.url ?? "";
    calls.push(url);
    const status = routes[url]?.shift() ?? 200;
    const response = { status, statusText: "", headers: {}, config, data: { url } };
    if (status >= 400) throw new AxiosError("fail", String(status), config, null, response);
    return response;
  };
  return calls;
}

describe("http 401 refresh", () => {
  let refresh: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    refresh = vi.spyOn(axios, "post");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.cookie = "tx_session=; path=/; max-age=0";
  });

  it("refreshes once and replays the original request", async () => {
    refresh.mockResolvedValue({ status: 200 });
    const calls = useFakeServer({ "/wallet": [401, 200] });

    const res = await http.get("/wallet");

    expect(res.status).toBe(200);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(calls).toEqual(["/wallet", "/wallet"]);
  });

  it("shares a single refresh between parallel 401s", async () => {
    refresh.mockResolvedValue({ status: 200 });
    useFakeServer({ "/a": [401, 200], "/b": [401, 200], "/c": [401, 200] });

    await Promise.all([http.get("/a"), http.get("/b"), http.get("/c")]);

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("ends the session when the refresh itself fails", async () => {
    refresh.mockRejectedValue(new Error("expired"));
    useFakeServer({ "/wallet": [401] });
    markSession();
    const assign = vi.fn();
    vi.spyOn(window, "location", "get").mockReturnValue({ ...window.location, pathname: "/wallet", assign });

    await expect(http.get("/wallet")).rejects.toBeInstanceOf(AxiosError);

    expect(hasSession()).toBe(false);
    expect(assign).toHaveBeenCalledWith("/signin");
  });

  it("never tries to refresh the auth endpoints themselves", async () => {
    useFakeServer({ "/login": [401] });

    await expect(http.post("/login")).rejects.toBeInstanceOf(AxiosError);

    expect(refresh).not.toHaveBeenCalled();
  });
});

describe("apiErrorMessage", () => {
  it("prefers the backend's message", () => {
    const error = new AxiosError("Request failed", "400", undefined, null, {
      status: 400,
      statusText: "",
      headers: {},
      config: {} as InternalAxiosRequestConfig,
      data: { message: "Insufficient funds for this trade" },
    });
    expect(apiErrorMessage(error, "fallback")).toBe("Insufficient funds for this trade");
  });

  it("uses a plain Error's message, but never technical text or crashes", () => {
    expect(apiErrorMessage(new Error("Insufficient funds for this trade"), "fallback")).toBe("Insufficient funds for this trade");
    expect(apiErrorMessage(new Error("Network Error"), "fallback")).toBe("fallback");
    expect(apiErrorMessage(new Error("Request failed with status code 404"), "fallback")).toBe("fallback");
    expect(apiErrorMessage(new TypeError("Cannot read properties of undefined"), "fallback")).toBe("fallback");
    expect(apiErrorMessage("weird", "fallback")).toBe("fallback");
  });

  const failed = (status: number, data: unknown = {}) =>
    new AxiosError("Request failed with status code " + status, String(status), undefined, null, {
      status,
      statusText: "",
      headers: {},
      config: {} as InternalAxiosRequestConfig,
      data,
    });

  it("never shows status codes or server jargon", () => {
    expect(apiErrorMessage(failed(404), "We couldn't find that stock.")).toBe("We couldn't find that stock.");
    expect(apiErrorMessage(failed(500, { message: "Internal Server Error" }), "fallback")).toBe(MESSAGES.server);
    expect(apiErrorMessage(failed(503), "fallback")).toBe(MESSAGES.server);
    expect(apiErrorMessage(failed(429), "fallback")).toBe(MESSAGES.tooMany);
    expect(apiErrorMessage(failed(401, { message: "jwt expired" }), "fallback")).toBe(MESSAGES.signIn);
  });

  it("explains network failures", () => {
    expect(apiErrorMessage(new AxiosError("Network Error", "ERR_NETWORK"), "fallback")).toBe(MESSAGES.offline);
    expect(apiErrorMessage(new AxiosError("timeout of 10000ms exceeded", "ECONNABORTED"), "fallback")).toBe(MESSAGES.timeout);
  });
});
