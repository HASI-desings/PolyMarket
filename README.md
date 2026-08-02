# Whale Convergence — Polymarket Whale Tracker (PWA)

A mobile-first PWA that scans Polymarket's top 50 traders, finds where their
open positions overlap, and ranks those trades by conviction — with a
built-in return calculator per trade.

## How it works

1. `GET /api/leaderboard` → pulls the top 50 wallets by all-time profit from
   Polymarket's public Data API (`data-api.polymarket.com/v1/leaderboard`).
2. `POST /api/positions` → for each wallet, fetches open positions
   (`data-api.polymarket.com/positions`), throttled ~180ms apart with
   automatic retry-on-429, and aggregates them by outcome token.
3. Trades held by 2+ of the top 50 are ranked into "The Menu," highest
   overlap first.
4. Each card has a bet-size input that multiplies your amount by the current
   outcome price to show payout/profit.

Both API routes run server-side (Next.js Route Handlers), so your API key
never gets exposed in client-side network calls to Polymarket, and CORS is a
non-issue.

## Local setup

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`. On first load you'll be prompted to add an API
key in Settings (optional — the leaderboard endpoint is public; a key only
matters if your provider/tier requires one for position data).

## Deploying to Vercel

1. Push this folder to a new GitHub repo:
   ```bash
   git init
   git add .
   git commit -m "Initial commit — Whale Convergence tracker"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
2. Go to [vercel.com/new](https://vercel.com/new), import the repo, leave all
   defaults (Next.js is auto-detected), and click **Deploy**.
3. Once deployed, open the Vercel URL on your iPhone in Safari, tap **Share →
   Add to Home Screen**. It installs as a standalone app with no browser
   chrome.

No environment variables are required — the app calls Polymarket's public
Data API directly from the server routes. If you later want to hardcode a
default provider key instead of relying on the client-supplied one, add it
as a Vercel environment variable and read it as a fallback in the two route
handlers under `app/api/`.

## Filter Whales page (`/traders`)

- Lists the top 50 traders with a checkbox each. Checking traders and hitting
  **Save Settings** stores that exact list in `localStorage` — the main scan
  then only pulls positions for those wallets. Anyone left unchecked is
  dropped from the saved list the moment you save (nothing to manually
  "remove").
- A category filter (Politics / Crypto / Sports / AI / Finance / Other) is
  saved alongside the whale selection and applies to the Trades menu on the
  home page too.
- **Template codes**: saving generates a `WT1-…` code (your whale list +
  category filters, base64-encoded). Copy it, store it anywhere, and paste it
  into the box at the top of this page any time to instantly re-apply that
  exact setup — on this device or a different one.

## Trader profile page (`/traders/[address]`)

Pulls real, live data for a single wallet from Polymarket's Data API:
- 30-day profit and 30-day trade count (from `/activity`)
- Current open position count and total exposure (from `/positions`)
- A category breakdown chart of what they're currently holding (Politics /
  Crypto / Sports / AI / Finance / Other), built from the same keyword
  classifier used everywhere else in the app
- A live list of their current open positions with size, value, and P&L

If Polymarket returns no data for a wallet (private profile, no activity,
etc.), the page says so explicitly rather than showing fabricated numbers.

## Project structure

```
app/
  api/
    leaderboard/route.js         # proxies + caches top-50 leaderboard
    positions/route.js           # throttled per-wallet fetch + overlap aggregation + category tagging
    trader/[address]/route.js    # single-wallet real stats: 30d profit, trade count, categories
  traders/
    page.jsx                     # Filter Whales page: select traders, category filter, template code
    [address]/page.jsx           # Trader profile page: real stats + category chart
  layout.jsx                     # PWA / iOS meta tags, service worker registration
  page.jsx                       # main UI: scan trigger, progress, category filter, results
  globals.css
components/
  SettingsModal.jsx         # API key input, saved to localStorage
  WhaleCard.jsx              # trade card + category badge + return calculator
  TraderRow.jsx              # trader checkbox row (Filter Whales page)
  CategoryFilter.jsx         # reusable category chip menu
  Spinner.jsx
lib/
  categorize.js               # keyword-based category classifier
  templateCode.js              # encode/decode WT1- template codes
public/
  manifest.json             # PWA manifest
  sw.js                      # service worker (shell caching, network-first API)
  icons/                     # app icons (192, 512, maskable 512)
```

## Notes on rate limiting

`app/api/positions/route.js` fetches whale portfolios **sequentially** with a
180ms gap between requests, and retries up to twice with backoff on a 429.
If you're on a very restrictive free tier, bump `THROTTLE_MS` in that file.

## Customizing the leaderboard source

The leaderboard and positions endpoints currently point at Polymarket's
public Data API directly. If you're using a Parse.bot-style wrapper instead,
just swap the `url` constants in `app/api/leaderboard/route.js` and
`app/api/positions/route.js` — the rest of the app (throttling, aggregation,
UI) doesn't need to change.
