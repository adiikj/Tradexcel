import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ getWatchlist: vi.fn(), addToWatchlist: vi.fn(), removeFromWatchlist: vi.fn() }));
const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock("../api/api", () => api);
vi.mock("react-hot-toast", () => ({ default: toast }));

const { useWatchlist } = await import("./useWatchlist");

beforeEach(() => {
  vi.clearAllMocks();
  api.getWatchlist.mockResolvedValue(["TCS.NS"]);
});

describe("useWatchlist", () => {
  it("loads the saved list and toggles stocks on and off", async () => {
    const { result } = renderHook(() => useWatchlist());
    await waitFor(() => expect(result.current.symbols).toEqual(["TCS.NS"]));

    api.addToWatchlist.mockResolvedValue(["TCS.NS", "INFY.NS"]);
    await act(() => result.current.toggle("INFY.NS"));
    expect(api.addToWatchlist).toHaveBeenCalledWith("INFY.NS");
    expect(result.current.symbols).toEqual(["TCS.NS", "INFY.NS"]);

    api.removeFromWatchlist.mockResolvedValue(["INFY.NS"]);
    await act(() => result.current.toggle("TCS.NS"));
    expect(api.removeFromWatchlist).toHaveBeenCalledWith("TCS.NS");
    expect(result.current.symbols).toEqual(["INFY.NS"]);
  });

  it("rolls back and explains when the server refuses", async () => {
    const { result } = renderHook(() => useWatchlist());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    api.addToWatchlist.mockRejectedValue(new Error("Your watchlist can hold up to 50 stocks"));
    await act(() => result.current.toggle("ITC.NS"));
    expect(result.current.symbols).toEqual(["TCS.NS"]);
    expect(toast.error).toHaveBeenCalledWith("Your watchlist can hold up to 50 stocks");
  });
});
