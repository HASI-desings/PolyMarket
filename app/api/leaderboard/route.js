// Proxies the Polymarket Data API leaderboard endpoint.
// Forwards the user's own API key (if they set one in Settings) as a Bearer token.
// The public leaderboard endpoint itself does not require a key, but we forward
// it anyway so a user-supplied Parse.bot / paid key works transparently.

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit") || "50";
  const orderBy = searchParams.get("orderBy") || "PROFIT"; // PROFIT | VOL
  const apiKey = request.headers.get("x-api-key");

  const url = `https://data-api.polymarket.com/v1/leaderboard?window=all&sortBy=${orderBy}&limit=${limit}`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      // leaderboard changes slowly; light edge caching to protect rate limits
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      return Response.json(
        { error: `Leaderboard fetch failed (${res.status})` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return Response.json({ traders: Array.isArray(data) ? data.slice(0, Number(limit)) : data });
  } catch (err) {
    return Response.json({ error: "Could not reach Polymarket leaderboard." }, { status: 502 });
  }
}
