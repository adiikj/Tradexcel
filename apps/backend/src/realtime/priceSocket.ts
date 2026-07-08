import type { Server as HttpServer } from "http";
import { Server as SocketIOServer, type Socket } from "socket.io";
import { corsOptions } from "../config/cors.js";
import { getQuotes } from "../services/pricing.js";
import { isMarketOpen, getNextOpenLabel } from "../services/marketHours.js";
import { MAX_BATCH_SYMBOLS } from "../controllers/finance.controller.js";

function buildMarketStatusPayload() {
  const open = isMarketOpen();
  return { open, nextOpenLabel: open ? null : getNextOpenLabel() };
}

const BROADCAST_INTERVAL_MS = 5000;
const MAX_CONNECTIONS_PER_IP = 8;

// symbol -> subscribed socket ids, and the inverse for O(1) cleanup on disconnect.
const subscriptions = new Map<string, Set<string>>();
const socketSymbols = new Map<string, Set<string>>();
const connectionsByIp = new Map<string, number>();
const lastBroadcast = new Map<string, { price: number; changePercent: number | null }>();

function normalizeSymbols(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const cleaned = [...new Set(raw.map((s) => String(s).trim().toUpperCase()).filter(Boolean))];
  return cleaned.slice(0, MAX_BATCH_SYMBOLS);
}

function subscribe(socket: Socket, symbols: string[]) {
  const mine = socketSymbols.get(socket.id)!;
  for (const symbol of symbols) {
    if (mine.has(symbol)) continue;
    mine.add(symbol);
    socket.join(symbol);
    if (!subscriptions.has(symbol)) subscriptions.set(symbol, new Set());
    subscriptions.get(symbol)!.add(socket.id);
  }
}

function unsubscribe(socket: Socket, symbols: string[]) {
  const mine = socketSymbols.get(socket.id);
  for (const symbol of symbols) {
    mine?.delete(symbol);
    socket.leave(symbol);
    subscriptions.get(symbol)?.delete(socket.id);
  }
}

function cleanupSocket(socket: Socket, ip: string) {
  const remaining = (connectionsByIp.get(ip) || 1) - 1;
  if (remaining <= 0) connectionsByIp.delete(ip);
  else connectionsByIp.set(ip, remaining);

  const mine = socketSymbols.get(socket.id);
  if (mine) {
    for (const symbol of mine) subscriptions.get(symbol)?.delete(socket.id);
  }
  socketSymbols.delete(socket.id);
}

// One centralized poll loop feeds every connected client, instead of each
// client polling the REST endpoint itself - Yahoo call volume stays bounded
// to "however many distinct symbols someone is watching right now" no matter
// how many browsers are open. getQuotes() already caches per-symbol for 12s,
// so ticking every 5s doesn't add Yahoo load beyond what a single viewer
// already causes.
function startBroadcastLoop(io: SocketIOServer) {
  let marketWasOpen = isMarketOpen();

  setInterval(async () => {
    const marketOpen = isMarketOpen();
    if (marketOpen !== marketWasOpen) {
      marketWasOpen = marketOpen;
      io.emit("marketStatus", buildMarketStatusPayload());
    }

    // NSE prices can't move outside trading hours - nothing to fetch or emit.
    if (!marketOpen) return;

    const activeSymbols = [...subscriptions.entries()]
      .filter(([, sockets]) => sockets.size > 0)
      .map(([symbol]) => symbol);

    if (activeSymbols.length === 0) return;

    const quotes = await getQuotes(activeSymbols);

    for (const symbol of activeSymbols) {
      const quote = quotes[symbol];
      if (!quote) continue;

      const prev = lastBroadcast.get(symbol);
      if (prev && prev.price === quote.price && prev.changePercent === quote.changePercent) {
        continue;
      }

      lastBroadcast.set(symbol, { price: quote.price, changePercent: quote.changePercent });
      io.to(symbol).emit("price", {
        symbol,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        timestamp: quote.timestamp,
      });
    }
  }, BROADCAST_INTERVAL_MS);
}

// Public market data only (same trust boundary as the unauthenticated
// /finance/quotes REST route) - no socket-level auth needed.
export function initPriceSocket(httpServer: HttpServer) {
  const io = new SocketIOServer(httpServer, {
    cors: { origin: corsOptions.origin },
  });

  io.on("connection", (socket) => {
    const ip = socket.handshake.address || "unknown";
    const count = (connectionsByIp.get(ip) || 0) + 1;

    if (count > MAX_CONNECTIONS_PER_IP) {
      socket.disconnect(true);
      return;
    }

    connectionsByIp.set(ip, count);
    socketSymbols.set(socket.id, new Set());
    socket.emit("marketStatus", buildMarketStatusPayload());

    socket.on("subscribe", (symbols: unknown) => subscribe(socket, normalizeSymbols(symbols)));
    socket.on("unsubscribe", (symbols: unknown) => unsubscribe(socket, normalizeSymbols(symbols)));
    socket.on("disconnect", () => cleanupSocket(socket, ip));
  });

  startBroadcastLoop(io);

  return io;
}
