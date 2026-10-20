# Tradexcel — frontend

Next.js 16 (App Router) + TypeScript + Tailwind + Redux Toolkit, talking to
the Express API in `apps/backend`.

```bash
pnpm dev          # http://localhost:3000
pnpm build        # production build
pnpm start        # serve the production build
pnpm lint         # eslint
pnpm test         # vitest
pnpm typecheck    # tsc --noEmit
```

## Environment

Copy `.env.example` to `.env` and fill it in:

| Variable | What it is |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | The API's user/auth routes (`/api/v1/users`) |
| `NEXT_PUBLIC_API_FINANCE_URL` | The market-data routes (`/api/v1/finance`) |
| `NEXT_PUBLIC_API_TRADE_URL` | The API root — the trade, portfolio and contest routes hang off it |
| `NEXT_PUBLIC_SOCKET_URL` | Where the Socket.IO price feed connects |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google sign-in |
| `NEXT_PUBLIC_SITE_URL` | The site's own public origin. Every canonical tag, OpenGraph URL, social card and sitemap entry is built from this, so it must be the real domain. Defaults to the shared `SITE_URL` constant. |

The three API base URLs point at the same host — they only differ in which
group of routes they address. They can be collapsed into one variable.

## How it fits together

- `src/app/` — the routes, one directory per page.
- `src/components/` — the UI, grouped by feature.
- `src/api/` — one module per domain over a shared axios instance that
  refreshes the session on a 401.
- `src/hooks/` — the shared hooks: live quotes, market status, the clock.
- `src/lib/socket.ts` — the shared Socket.IO connection.
- `src/utils/` — formatting, the season clock, the session flag.
- `@tradexcel/shared` — the wire types and the constants both apps use
  (`SITE_URL`, the stock list, the charge rates).

The API types live in `packages/shared`, so a change to a response shape is
a type error in both apps at once.

Two things are known rough edges, tracked in the architecture review:

- **The app shell is not a layout.** Each signed-in page renders `<Header>`
  and `<Vheader>` itself, so every navigation rebuilds the shell and
  re-fetches the profile, the achievements and the alerts. Moving them into
  an `app/(app)/layout.tsx` route group would fix it.
- **There is no data layer.** Pages fetch in `useEffect` with no cache, no
  dedup and no cancellation, so the same request goes out more than once
  (the user profile is fetched from six places).

