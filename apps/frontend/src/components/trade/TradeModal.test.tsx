import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  getStockData: vi.fn(),
  buyStock: vi.fn(),
  sellStock: vi.fn(),
  buyContestStock: vi.fn(),
  sellContestStock: vi.fn(),
}));
const market = vi.hoisted(() => ({ open: true as boolean | null }));

vi.mock("../../api/api", () => api);
vi.mock("../../hooks/useMarketStatus", () => ({ useMarketStatus: () => ({ open: market.open, nextOpenLabel: null }) }));
vi.mock("react-hot-toast", () => ({ default: { success: vi.fn(), error: vi.fn() } }));

const { default: TradeModal } = await import("./TradeModal");

function open(props: Partial<React.ComponentProps<typeof TradeModal>> = {}) {
  return render(
    <TradeModal symbol="TCS.NS" side="BUY" initialPrice={1000} availableCash={100000} availableQty={10} onClose={vi.fn()} onSuccess={vi.fn()} {...props} />
  );
}

const submit = () => screen.getByRole("button", { name: /confirm|place|queue/i });

beforeEach(() => {
  vi.clearAllMocks();
  market.open = true;
  api.buyStock.mockResolvedValue({ data: {} });
  api.sellStock.mockResolvedValue({ data: {} });
});

describe("TradeModal", () => {
  it("adds estimated charges to a market buy", () => {
    open();
    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "100" } });
    // ₹1,00,000 buy: ₹142.22 in charges (see backend charges.test.ts)
    expect(screen.getByText("+₹142.22")).toBeTruthy();
    expect(screen.getByText("₹1,00,142.22")).toBeTruthy();
    // ...which is more than the ₹1,00,000 available
    expect(screen.getByText("Total with charges exceeds your available cash.")).toBeTruthy();
    expect((submit() as HTMLButtonElement).disabled).toBe(true);
  });

  it("sends a limit order with its price", async () => {
    open();
    fireEvent.click(screen.getByRole("button", { name: "Limit" }));
    expect((submit() as HTMLButtonElement).disabled).toBe(true); // no price yet
    fireEvent.change(screen.getByLabelText("Limit price (₹)"), { target: { value: "950.5" } });
    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "4" } });
    fireEvent.click(submit());
    await waitFor(() => expect(api.buyStock).toHaveBeenCalledWith("TCS.NS", 4, { orderType: "LIMIT", triggerPrice: 950.5 }));
  });

  it("blocks a stop-loss sell whose trigger is above the live price", () => {
    open({ side: "SELL" });
    fireEvent.click(screen.getByRole("button", { name: "Stop-loss" }));
    fireEvent.change(screen.getByLabelText("Trigger price (₹)"), { target: { value: "1010" } });
    expect(screen.getByText(/trigger must be below the live price/)).toBeTruthy();
    expect((submit() as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(screen.getByLabelText("Trigger price (₹)"), { target: { value: "900" } });
    expect(screen.queryByText(/trigger must be below/)).toBeNull();
    expect((submit() as HTMLButtonElement).disabled).toBe(false);
  });

  it("keeps contests market-only and charge-free", () => {
    open({ contestId: "c1" });
    expect(screen.queryByRole("group", { name: "Order type" })).toBeNull();
    expect(screen.queryByText(/Charges/)).toBeNull();
  });
});
