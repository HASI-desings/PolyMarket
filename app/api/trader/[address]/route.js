import { categorize } from "../../../../lib/categorize";

// Aggregates a single trader's real account data:
// - current open positions (for category breakdown + live exposure)
// - trade activity history (for 30-day profit + trade count)
//
// Both calls hit Polymarket's public Data API directly, scoped to one wallet.

export async function GET(request, { params }) {
  const address = params.address;
  const apiKey = request.headers.get("x-api-key");
  const headers = {
    Accept: "application/json",
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
  };

  if (!address) {
    return Response.json({ error: "Missing wallet address." }, { status: 400 });
  }

  const positionsUrl = `https://data-api.polymarket.com/positions?user=${address}&sizeThreshold=1&limit=200&sortBy=CURRENT&sortDirection=DESC`;
  const activityUrl = `https://data-api.polymarket.com/activity?user=${address}&limit=500&sortBy=TIMESTAMP&sortDirection=DESC`;

  const [posRes, actRes] = await Promise.allSettled([
    fetch(positionsUrl, { headers }),
    fetch(activityUrl, { headers }),
  ]);

  let positions = [];
  if (posRes.status === "fulfilled" && posRes.value.ok) {
    const data = await posRes.value.json();
    positions = Array.isArray(data) ? data : data?.positions || [];
  }

  let activity = [];
  if (actRes.status === "fulfilled" && actRes.value.ok) {
    const data = await actRes.value.json();
    activity = Array.isArray(data) ? data : data?.activity || [];
  }

  // --- Category breakdown from current open positions ---
  const categoryCounts = {};
  for (const pos of positions) {
    const title = pos.title || pos.eventTitle || pos.marketQuestion || "";
    const cat = categorize(title);
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }
  const categoryBreakdown = Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  // --- 30-day trade count + profit from activity/trade history ---
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const cutoff = Date.now() - THIRTY_DAYS_MS;

  let trades30d = 0;
  let profit30d = 0;
  let allTimeTrades = activity.length;

  for (const a of activity) {
    const ts = Number(a.timestamp ?? a.time ?? 0) * (String(a.timestamp ?? a.time ?? "").length <= 10 ? 1000 : 1);
    const isTrade = (a.type || a.activityType || "").toUpperCase().includes("TRADE") || a.side;
    if (!isTrade) continue;
    if (ts && ts >= cutoff) {
      trades30d += 1;
      const pnl = Number(a.pnl ?? a.realizedPnl ?? a.cashPnl ?? 0);
      profit30d += pnl;
    }
  }

  // Fallback: if activity feed doesn't expose per-trade pnl, approximate
  // 30-day profit from current position cashPnl as a rough live proxy.
  if (profit30d === 0 && positions.length > 0) {
    profit30d = positions.reduce((sum, p) => sum + Number(p.cashPnl ?? p.pnl ?? 0), 0);
  }

  const totalCurrentValue = positions.reduce(
    (sum, p) => sum + Number(p.currentValue ?? p.value ?? 0),
    0
  );

  return Response.json({
    address,
    stats: {
      openPositions: positions.length,
      trades30d,
      allTimeTrades,
      profit30d: Number(profit30d.toFixed(2)),
      totalCurrentValue: Number(totalCurrentValue.toFixed(2)),
    },
    categoryBreakdown,
    positions: positions.slice(0, 25).map((p) => ({
      title: p.title || p.eventTitle || p.marketQuestion || "Untitled market",
      category: categorize(p.title || p.eventTitle || p.marketQuestion || ""),
      outcome: p.outcome || p.outcomeName || "—",
      size: Number(p.size ?? p.shares ?? 0),
      currentValue: Number(p.currentValue ?? p.value ?? 0),
      price: Number(p.curPrice ?? p.price ?? p.currentPrice ?? 0),
      pnl: Number(p.cashPnl ?? p.pnl ?? 0),
    })),
    dataAvailable: positions.length > 0 || activity.length > 0,
  });
}
