import type { ChatReply } from "@tradexcel/shared";

export type ChatMessage =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; reply: ChatReply }
  | { id: string; role: "error"; text: string; retry: string };

// Per-tab conversation history, so it survives moving between pages and
// reloads but not closing the tab. Storage can be unavailable (private mode,
// blocked site data), so every access is guarded and the chat still works
// without it.
const KEY = "tx_chat_v1";
const MAX_MESSAGES = 40;

export function loadMessages(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMessages(messages: ChatMessage[]): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(messages.filter((m) => m.role !== "error").slice(-MAX_MESSAGES)));
  } catch {
    // Not persisting is fine.
  }
}

export function clearMessages(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Nothing stored, nothing to clear.
  }
}
