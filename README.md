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

## Project structure

```
app/
  api/
    leaderboard/route.js   # proxies + caches top-50 leaderboard
    positions/route.js     # throttled per-wallet fetch + overlap aggregation
  layout.jsx                # PWA / iOS meta tags, service worker registration
  page.jsx                  # main UI: scan trigger, progress, results
  globals.css
components/
  SettingsModal.jsx         # API key input, saved to localStorage
  WhaleCard.jsx              # trade card + return calculator
  Spinner.jsx
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
