import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;

let socket: Socket | null = null;
const refCounts = new Map<string, number>();

// Lazily created singleton - every page that wants live prices shares one
// underlying connection instead of opening a new socket per component.
export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket"],
      autoConnect: true,
    });
  }
  return socket;
}

// Ref-counted subscribe: multiple components (Market, Portfolio, Dashboard,
// TopGainers/TopLosers) can all want overlapping symbols on this one shared
// socket at the same time. Only emits "subscribe" to the server the first
// time a symbol goes from 0 interested callers to 1, and only emits
// "unsubscribe" when the last interested caller drops it - otherwise one
// component unmounting would silently kill another component's live ticks
// for any symbol they both happened to be watching.
export function subscribeSymbols(symbols: string[]): () => void {
  const s = getSocket();
  const toSubscribe: string[] = [];

  for (const symbol of symbols) {
    const next = (refCounts.get(symbol) || 0) + 1;
    refCounts.set(symbol, next);
    if (next === 1) toSubscribe.push(symbol);
  }
  if (toSubscribe.length > 0) s.emit("subscribe", toSubscribe);

  let released = false;
  return () => {
    if (released) return;
    released = true;

    const toUnsubscribe: string[] = [];
    for (const symbol of symbols) {
      const next = (refCounts.get(symbol) || 1) - 1;
      if (next <= 0) {
        refCounts.delete(symbol);
        toUnsubscribe.push(symbol);
      } else {
        refCounts.set(symbol, next);
      }
    }
    if (toUnsubscribe.length > 0) s.emit("unsubscribe", toUnsubscribe);
  };
}
