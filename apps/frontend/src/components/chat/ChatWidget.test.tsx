import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatReply } from "@tradexcel/shared";

const nav = vi.hoisted(() => ({ pathname: "/dashboard" }));
const api = vi.hoisted(() => ({ sendChatMessage: vi.fn(), getUserProfile: vi.fn() }));

vi.mock("next/navigation", () => ({ usePathname: () => nav.pathname }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("../../api/api", () => api);

const { default: ChatWidget } = await import("./ChatWidget");

const reply = (over: Partial<ChatReply> = {}): { data: ChatReply } => ({
  data: { kind: "answer", intent: "faq_platform", text: "Every Monday your wallet **resets**.", links: [{ label: "Open Wallet", href: "/wallet" }], suggestions: ["What's my rank?"], cardId: "season.weekly_reset", confidence: 0.9, ...over },
});

function signIn(on: boolean) {
  document.cookie = on ? "tx_session=1; path=/" : "tx_session=; path=/; max-age=0";
}

async function ask(text: string) {
  fireEvent.change(screen.getByLabelText("Message Tex"), { target: { value: text } });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  api.getUserProfile.mockResolvedValue({ data: { name: "Aditya Kumar Jha" } });
  sessionStorage.clear();
  nav.pathname = "/dashboard";
  signIn(true);
});

describe("ChatWidget", () => {
  it("only shows on signed-in app pages", () => {
    nav.pathname = "/";
    const { rerender } = render(<ChatWidget />);
    expect(screen.queryByLabelText("Ask Tex, the Tradexcel assistant")).toBeNull();

    nav.pathname = "/dashboard";
    signIn(false);
    rerender(<ChatWidget />);
    expect(screen.queryByLabelText("Ask Tex, the Tradexcel assistant")).toBeNull();
  });

  it("sends a message and renders the reply with links and suggestions", async () => {
    api.sendChatMessage.mockResolvedValue(reply());
    render(<ChatWidget />);
    fireEvent.click(screen.getByLabelText("Ask Tex, the Tradexcel assistant"));
    await ask("when does my wallet reset");

    expect(api.sendChatMessage).toHaveBeenCalledWith("when does my wallet reset");
    expect(screen.getByText("when does my wallet reset")).toBeTruthy();
    expect(screen.getByText("resets").tagName).toBe("STRONG");
    expect(screen.getByRole("link", { name: /Open Wallet/ }).getAttribute("href")).toBe("/wallet");

    api.sendChatMessage.mockResolvedValue(reply({ kind: "data", text: "You're **#3**.", links: [], suggestions: [] }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "What's my rank?" }));
    });
    expect(api.sendChatMessage).toHaveBeenLastCalledWith("What's my rank?");
    expect(screen.getByText("#3")).toBeTruthy();
  });

  it("shows quote cards for price answers", async () => {
    api.sendChatMessage.mockResolvedValue(
      reply({ kind: "data", text: "- **TCS**: ₹3,500", links: [], suggestions: [], quotes: [{ symbol: "TCS.NS", name: "TCS", price: 3500, change: 35, changePercent: 1.01 }] })
    );
    render(<ChatWidget />);
    fireEvent.click(screen.getByLabelText("Ask Tex, the Tradexcel assistant"));
    await ask("tcs price");
    const card = screen.getByRole("link", { name: /1\.01% today/ });
    expect(card.getAttribute("href")).toBe("/market?symbol=TCS.NS");
  });

  it("offers a retry when the request fails", async () => {
    api.sendChatMessage.mockRejectedValueOnce(new Error("The assistant is still starting up."));
    render(<ChatWidget />);
    fireEvent.click(screen.getByLabelText("Ask Tex, the Tradexcel assistant"));
    await ask("hello");
    expect(screen.getByText("The assistant is still starting up.")).toBeTruthy();

    api.sendChatMessage.mockResolvedValue(reply({ kind: "answer", text: "Hi there!", links: [], suggestions: [] }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Try again/ }));
    });
    expect(api.sendChatMessage).toHaveBeenLastCalledWith("hello");
    expect(screen.queryByText("The assistant is still starting up.")).toBeNull();
    expect(screen.getByText("Hi there!")).toBeTruthy();
  });

  it("closes on Escape and keeps the conversation across remounts", async () => {
    api.sendChatMessage.mockResolvedValue(reply({ text: "Kept answer", links: [], suggestions: [] }));
    const { unmount } = render(<ChatWidget />);
    fireEvent.click(screen.getByLabelText("Ask Tex, the Tradexcel assistant"));
    await ask("remember me");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    unmount();

    render(<ChatWidget />);
    fireEvent.click(screen.getByLabelText("Ask Tex, the Tradexcel assistant"));
    expect(screen.getByText("Kept answer")).toBeTruthy();
  });

  it("greets the user by first name", async () => {
    render(<ChatWidget />);
    await act(async () => {
      fireEvent.click(screen.getByLabelText("Ask Tex, the Tradexcel assistant"));
    });
    expect(screen.getByRole("heading", { level: 3 }).textContent).toMatch(/^(Good (morning|afternoon|evening)|Hey there), Aditya$/);
  });

  it("forgets the conversation once signed out", async () => {
    sessionStorage.setItem("tx_chat_v1", JSON.stringify([{ id: "1", role: "user", text: "old user's question" }]));
    signIn(false);
    render(<ChatWidget />);
    expect(sessionStorage.getItem("tx_chat_v1")).toBeNull();
  });
});
