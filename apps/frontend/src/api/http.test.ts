import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import http, { apiErrorMessage } from "./http";
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

  it("falls back to the error's own message, then the fallback", () => {
    expect(apiErrorMessage(new Error("Network Error"), "fallback")).toBe("Network Error");
    expect(apiErrorMessage("weird", "fallback")).toBe("fallback");
  });
});
