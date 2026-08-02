// Encodes a user's whale selection + filter prefs into a portable "template
// code" they can copy, save anywhere, and paste back in later (or share).
// Format: WT1-<base64url JSON>

const PREFIX = "WT1-";

function b64urlEncode(str) {
  const b64 = typeof window === "undefined"
    ? Buffer.from(str, "utf-8").toString("base64")
    : btoa(unescape(encodeURIComponent(str)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str) {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  return typeof window === "undefined"
    ? Buffer.from(padded, "base64").toString("utf-8")
    : decodeURIComponent(escape(atob(padded)));
}

export function encodeTemplate(config) {
  try {
    const json = JSON.stringify(config);
    return PREFIX + b64urlEncode(json);
  } catch {
    return null;
  }
}

export function decodeTemplate(code) {
  if (!code || !code.startsWith(PREFIX)) return null;
  try {
    const json = b64urlDecode(code.slice(PREFIX.length));
    const parsed = JSON.parse(json);
    if (!parsed || !Array.isArray(parsed.wallets)) return null;
    return parsed;
  } catch {
    return null;
  }
}
