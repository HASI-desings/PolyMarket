// Fetches open positions for each whale wallet and aggregates them into a
// ranked "convergence menu" — grouped by outcome token, counted by how many
// of the top traders currently hold it.
//
// Throttled sequential fetching (with small delay) protects the free-tier
// rate limit on Polymarket's Data API when pulling ~50 portfolios.

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const THROTTLE_MS = 180; // spacing between each whale's portfolio request
const MAX_RETRIES = 2;

async function fetchWithRetry(url, headers, attempt = 0) {
  const res = await fetch(url, { headers });
  if (res.status === 429 && attempt < MAX_RETRIES) {
    await sleep(600 * (attempt + 1));
    return fetchWithRetry(url, headers, attempt + 1);
  }
  return res;
}

export async function POST(request) {
  const apiKey = request.headers.get("x-api-key");
  const body = await request.json().catch(() => ({}));
  const wallets = Array.isArray(body.wallets) ? body.wallets.slice(0, 50) : [];

  if (wallets.length === 0) {
    return Response.json({ error: "No wallets provided." }, { status: 400 });
  }

  const headers = {
    Accept: "application/json",
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
  };

  const overlapMap = new Map(); // key: clobTokenId or conditionId+outcome
  const failedWallets = [];

  for (let i = 0; i < wallets.length; i++) {
    const wallet = wallets[i];
    const url = `https://data-api.polymarket.com/positions?user=${wallet.address}&sizeThreshold=1&limit=100&sortBy=CURRENT&sortDirection=DESC`;

    try {
      const res = await fetchWithRetry(url, headers);
      if (!res.ok) {
        failedWallets.push({ address: wallet.address, status: res.status });
      } else {
        const positions = await res.json();
        const list = Array.isArray(positions) ? positions : positions?.positions || [];

        for (const pos of list) {
          const key =
            pos.clobTokenId ||
            pos.asset ||
            `${pos.conditionId || pos.market}-${pos.outcome}`;
          if (!key) continue;

          if (!overlapMap.has(key)) {
            overlapMap.set(key, {
              key,
              marketTitle: pos.title || pos.eventTitle || pos.marketQuestion || "Untitled market",
              outcome: pos.outcome || pos.outcomeName || "—",
              clobTokenId: pos.clobTokenId || pos.asset || null,
              conditionId: pos.conditionId || pos.market || null,
              slug: pos.slug || pos.eventSlug || null,
              currentPrice: Number(pos.curPrice ?? pos.price ?? pos.currentPrice ?? 0),
              whales: [],
            });
          }

          const entry = overlapMap.get(key);
          entry.whales.push({
            address: wallet.address,
            username: wallet.username,
            rank: wallet.rank,
            size: Number(pos.size ?? pos.shares ?? 0),
            value: Number(pos.currentValue ?? pos.value ?? 0),
          });
          // keep freshest price info
          if (pos.curPrice ?? pos.price ?? pos.currentPrice) {
            entry.currentPrice = Number(pos.curPrice ?? pos.price ?? pos.currentPrice);
          }
        }
      }
    } catch (err) {
      failedWallets.push({ address: wallet.address, status: "network_error" });
    }

    if (i < wallets.length - 1) await sleep(THROTTLE_MS);
  }

  const menu = Array.from(overlapMap.values())
    .map((entry) => ({ ...entry, whaleCount: entry.whales.length }))
    .filter((entry) => entry.whaleCount > 1) // only show actual convergence
    .sort((a, b) => b.whaleCount - a.whaleCount || b.currentPrice - a.currentPrice);

  return Response.json({
    menu,
    scanned: wallets.length,
    failed: failedWallets.length,
    failedWallets,
  });
}
