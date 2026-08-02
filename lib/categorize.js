// Lightweight keyword-based classifier so every trade/market can be tagged
// into a filterable category without needing an extra API call.

export const CATEGORIES = ["Politics", "Crypto", "Sports", "AI", "Finance", "Other"];

const RULES = [
  {
    category: "Politics",
    keywords: [
      "election", "president", "senate", "congress", "governor", "trump",
      "biden", "harris", "vote", "poll", "policy", "government", "supreme court",
      "impeach", "prime minister", "parliament", "republican", "democrat",
      "un ", "nato", "war", "ceasefire", "sanctions",
    ],
  },
  {
    category: "Crypto",
    keywords: [
      "bitcoin", "btc", "ethereum", "eth", "crypto", "solana", "sol ", "xrp",
      "dogecoin", "token", "airdrop", "defi", "nft", "stablecoin", "binance",
      "coinbase", "altcoin", "memecoin",
    ],
  },
  {
    category: "Sports",
    keywords: [
      "nfl", "nba", "mlb", "nhl", "soccer", "football", "basketball",
      "baseball", "tennis", "golf", "ufc", "boxing", "olympics", "world cup",
      "champions league", "super bowl", "playoffs", "match", "vs.", " vs ",
      "f1", "formula 1", "premier league",
    ],
  },
  {
    category: "AI",
    keywords: [
      "openai", "gpt", "chatgpt", "claude", "anthropic", "gemini", "llm",
      "artificial intelligence", " ai ", "ai model", "agi", "deepmind",
      "nvidia", "grok", "meta ai",
    ],
  },
  {
    category: "Finance",
    keywords: [
      "stock", "s&p", "nasdaq", "dow jones", "fed", "interest rate",
      "inflation", "recession", "earnings", "ipo", "gdp", "market cap",
      "treasury", "tariff", "economy", "unemployment",
    ],
  },
];

export function categorize(title = "") {
  const t = ` ${title.toLowerCase()} `;
  for (const rule of RULES) {
    if (rule.keywords.some((k) => t.includes(k))) return rule.category;
  }
  return "Other";
}
