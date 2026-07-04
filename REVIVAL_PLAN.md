# Mocket — Revival & Monorepo Migration Plan

_Date: 2026-06-26 · Status of repos audited from disk + git history._

> **Project name:** **Mocket** (a *mock market* — virtual money, real prices, contests, leaderboards). Renamed from the working title "TradeXcel." Built as a resume/portfolio project, not a commercial product (real-money stock sims are legally restricted in India).

A gamified stock-trading simulator: buy/sell stocks with virtual money, leaderboards, contests.

---

## 0. Honest state of the project (what's real vs. what's a shell)

Last **commits** in both repos are from **Jan 9, 2025**. But both working trees contain a large **uncommitted migration from ~March 2025** that exists only on disk — not committed, not pushed. **This is the #1 risk and step zero of everything below is preserving it.**

### What's actually built and working
- **Auth (full stack, real):** register, login, logout, OTP verification (Twilio SMS + Google/Nodemailer email), JWT access+refresh tokens, profile, avatar upload (Cloudinary), change password/PIN.
- **Stock price display (real):** backend proxies Yahoo Finance for a symbol's current price + 30-day chart; frontend renders it (Chart.js).
- **Frontend shell (real UI):** Next.js App Router pages exist for landing, dashboard, market, portfolio, leaderboard, contest, wallet, alerts, faq, profile.

### What is NOT built — i.e. the actual product is missing
- **❌ No trading engine.** Backend has only `user` and `pendingUsers` models. There is **no holdings / portfolio / transaction / order / wallet-balance model and no buy/sell endpoint anywhere.** The core "buy/sell stocks with virtual money" feature — the entire reason the product exists — does not exist server-side.
- **Portfolio page** = hardcoded dummy data.
- **Leaderboard** = hardcoded dummy data.
- **Contest / Wallet / Alerts** = UI only, no backend.

**Takeaway:** the polished part is the *account/onboarding* layer. The *game* itself still needs to be built. The revival roadmap below is sequenced around that reality.

### Migrations done but uncommitted
- **Backend:** JavaScript → TypeScript (all `.js` replaced by `.ts`, `tsconfig.json` added).
- **Frontend:** Vite + React (`.jsx`) → **Next.js 16 App Router + TypeScript** (`.tsx`, `src/app/` routing).

### Security check ✅
`.env` files (Mongo URI, Twilio, Google OAuth, Cloudinary secrets) were **never committed** — confirmed clean in full history of both repos. Safe to make the new repo public later. Keep `.env` gitignored; add `.env.example` files.

---

## Part A — Consolidate into one monorepo (without losing any commits)

**Decisions locked in:** fresh `Mocket` repo → archive the two old ones (`TradeXcel-backend`, `TradeXcel-frontend`). Layout: `apps/` + pnpm workspaces. History merged with `git subtree` (no extra tooling needed).

### Target structure
```
mocket/
├─ apps/
│  ├─ frontend/        # Next.js 16 (was TradeXcel-frontend)
│  └─ backend/         # Express + TS (was TradeXcel-backend)
├─ packages/
│  └─ shared/          # shared TS types (e.g. Stock, Order, Portfolio) used by both
├─ docs/
│  └─ reference/       # StockGro screenshots (design inspiration)
├─ package.json        # workspace root
├─ pnpm-workspace.yaml
├─ .gitignore
└─ README.md
```

### Step 0 — PRESERVE THE UNCOMMITTED WORK FIRST (do this before anything else)
Run in **each** old repo. Nothing can be lost once this is pushed.

```bash
# --- backend ---
cd TradeXcel-backend
git add -A
git commit -m "Migrate backend from JavaScript to TypeScript"
git push origin main

# --- frontend ---
cd ../TradeXcel-frontend
git add -A
git commit -m "Migrate frontend from Vite/React to Next.js + TypeScript"
git push origin main
```
> Note: `.next/` and `node_modules/` should not be committed — confirm `.gitignore` covers them before `git add -A` (frontend `.gitignore` already ignores `node_modules`; add `.next/` to it).

### Step 1 — create the monorepo and import both histories
```bash
cd ..                       # into Projects/TradeXcel parent
mkdir mocket && cd mocket
git init -b main
printf "# Mocket\n\nA mock stock market — gamified trading simulator with virtual money, contests, and leaderboards (monorepo).\n" > README.md
git add . && git commit -m "chore: initialize Mocket monorepo"

# import backend WITH full history under apps/backend
git remote add backend ../TradeXcel-backend
git fetch backend
git subtree add --prefix=apps/backend backend main

# import frontend WITH full history under apps/frontend
git remote add frontend ../TradeXcel-frontend
git fetch frontend
git subtree add --prefix=apps/frontend frontend main
```
`git subtree add` (no `--squash`) brings **every commit** from both repos into the unified history. `git log` shows all 17 + 37 commits; `git blame` and `git log --follow apps/backend/<file>` work.

> Cleaner alternative (optional): `pip install git-filter-repo`, then for each repo `git filter-repo --to-subdirectory-filter apps/backend` and `git merge --allow-unrelated-histories`. This rewrites historical paths so they *always* show the subdirectory. Subtree is the zero-install pragmatic choice and is fine for a solo project.

### Step 2 — add workspace wiring
`pnpm-workspace.yaml`:
```yaml
packages:
  - "apps/*"
  - "packages/*"
```
Root `package.json`:
```json
{
  "name": "mocket",
  "private": true,
  "scripts": {
    "dev": "pnpm -r --parallel dev",
    "dev:web": "pnpm --filter frontend dev",
    "dev:api": "pnpm --filter backend dev",
    "build": "pnpm -r build"
  }
}
```
Then `pnpm install` at the root, add `.env.example` files, move StockGro screenshots to `docs/reference/`, commit.

### Step 3 — push and archive
```bash
git remote remove backend && git remote remove frontend
# create empty repo "Mocket" on github.com (web UI, since gh CLI isn't installed)
git remote add origin https://github.com/Adiijha/Mocket.git
git push -u origin main
```
Then on GitHub: **Settings → Archive** both `TradeXcel-backend` and `TradeXcel-frontend` (read-only backups; do NOT delete).

---

## Part B — Revival roadmap (get to a real, playable product)

Sequenced so each phase ends with something runnable.

### Phase 1 — Foundation & green build (week 1)
- Finish monorepo migration (Part A).
- Get both apps building/running from root (`pnpm dev`). Fix any TS errors left over from the uncommitted migration.
- Add `.env.example`, a real `README` with setup steps, and basic CI (GitHub Actions: typecheck + build on PR).
- Create `packages/shared` with the core domain types you'll need next: `Stock`, `Holding`, `Order`, `Portfolio`, `Transaction`.

### Phase 2 — Build the actual trading engine (the missing core) (weeks 2–4)
This is the heart of the product and currently doesn't exist.
- **Models:** `Wallet` (virtual cash balance, default e.g. ₹1,00,000 on signup), `Holding` (user, symbol, qty, avgBuyPrice), `Transaction` (buy/sell, price, qty, timestamp).
- **Endpoints:** `POST /trade/buy`, `POST /trade/sell`, `GET /portfolio`, `GET /wallet`, `GET /transactions`. Enforce: can't buy beyond cash, can't sell more than held; price taken from the live Yahoo quote at execution.
- **Frontend:** wire Portfolio, Wallet, and a buy/sell modal to these endpoints (remove the dummy data). Show P&L per holding and total.
- **Pricing service:** cache Yahoo quotes (you'll hit rate limits otherwise) and support multi-symbol fetch.

### Phase 3 — Make the leaderboard & contests real (weeks 5–6)
- Compute portfolio value = wallet cash + Σ(holding qty × live price). Rank users → real leaderboard (replace dummy data).
- **Contests model:** time-boxed competitions (start/end, entry roster, starting balance, prize/badge). Snapshot standings, settle at end.

### Phase 4 — Polish & engagement (weeks 7–8)
- **Alerts:** real price-target alerts (cron checks quotes → email/SMS via the Twilio/Nodemailer you already have).
- Watchlists, search across symbols, dashboard summary cards from real data.
- Empty/loading/error states, dark-mode pass, mobile responsiveness.

### Phase 5 — Hardening & launch (weeks 9–10)
- Tests on the trading engine (the money math must be correct), input validation (zod), rate limiting, structured logging.
- Deploy: frontend on Vercel (already has `vercel.json`), backend on Render/Railway, MongoDB Atlas.
- Analytics + error tracking (PostHog / Sentry).

---

## Part C — Future scope (ideas to pick from)

**Engagement / gamification**
- Daily login streaks, XP & levels, achievement badges (first trade, 10% gain, contest win).
- Seasons / weekly tournaments with resets and a hall of fame.
- Friend system + private leagues (invite friends to a contest).

**Trading depth**
- Limit & stop-loss orders, short selling, simulated leverage/margin.
- Mutual funds / ETFs / crypto / US stocks alongside Indian equities.
- "Paper portfolios" you can fork from a strategy or another user.

**Learning / content (strong fit for a sim)**
- Guided lessons + quizzes ("learn investing"), with a sandbox tied to each lesson.
- AI assistant: explain a stock, summarize news, critique a portfolio's risk (Claude API).
- News feed per holdding (sentiment-tagged).

**Social**
- Public profiles showing (opt-in) returns, follow top traders, copy-trade their moves in your sim.
- Comment/discuss on stocks, share a trade as a card.

**Monetization (when ready)**
- Premium tier: advanced analytics, more contests, custom starting balances, ad-free.
- Sponsored contests / brand partnerships.
- B2B: white-label the sim for colleges/brokerages as an education tool.

**Platform**
- Mobile app (React Native / Expo, reusing `packages/shared`).
- Real-time price streaming via WebSockets instead of polling.
- Public API + webhooks for power users.

---

## Immediate next actions
1. ✅ Confirm this plan.
2. **Step 0** — commit & push the uncommitted TS/Next migration in both old repos (highest priority; protects ~a year-old work sitting only on disk).
3. Run Part A steps 1–3 to create the `Mocket` monorepo.
4. Start Phase 1.
