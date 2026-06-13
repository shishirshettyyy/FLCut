/**
 * Parse a raw Referer / Referrer-Policy header value into a human-readable
 * platform / source name.
 *
 * Rules (evaluated top-to-bottom):
 *  1. Check hostname/URL patterns from PLATFORM_MAP against the Referer header.
 *  2. If Referer is null/empty, check the User-Agent for WhatsApp's embedded
 *     browser token ("WhatsApp"). WhatsApp strips the Referer header, so UA
 *     detection is the only reliable way to identify these clicks.
 *  3. If Referer is null/empty and UA gives no signal → "Direct".
 */

interface ReferrerInfo {
  source: string;      // e.g. "Instagram", "WhatsApp", "Direct"
  rawReferrer: string; // original Referer header value, empty string if missing
}

const PLATFORM_MAP: [RegExp, string][] = [
  [/instagram\.com/i,           "Instagram"],
  [/l\.instagram\.com/i,        "Instagram"],
  [/linkedin\.com/i,            "LinkedIn"],
  [/lnkd\.in/i,                 "LinkedIn"],
  [/web\.whatsapp\.com/i,       "WhatsApp"],
  [/api\.whatsapp\.com/i,       "WhatsApp"],
  [/discord\.com/i,             "Discord"],
  [/discordapp\.com/i,          "Discord"],
  [/t\.co/i,                    "Twitter / X"],
  [/twitter\.com/i,             "Twitter / X"],
  [/x\.com/i,                   "Twitter / X"],
  [/facebook\.com/i,            "Facebook"],
  [/fb\.com/i,                  "Facebook"],
  [/m\.facebook\.com/i,         "Facebook"],
  [/reddit\.com/i,              "Reddit"],
  [/old\.reddit\.com/i,         "Reddit"],
  [/t\.me/i,                    "Telegram"],
  [/telegram\.org/i,            "Telegram"],
  [/youtube\.com/i,             "YouTube"],
  [/youtu\.be/i,                "YouTube"],
  [/slack\.com/i,               "Slack"],
  [/mail\.google\.com/i,        "Gmail"],
  [/outlook\.live\.com/i,       "Outlook"],
  [/github\.com/i,              "GitHub"],
  [/google\./i,                 "Google"],
  [/bing\.com/i,                "Bing"],
  [/duckduckgo\.com/i,          "DuckDuckGo"],
];

/**
 * @param refererHeader  - value of the HTTP `Referer` header (may be null)
 * @param userAgentHeader - value of the HTTP `User-Agent` header (may be null)
 */
export function parseReferrer(
  refererHeader: string | null | undefined,
  userAgentHeader?: string | null,
): ReferrerInfo {
  const raw = refererHeader?.trim() ?? "";

  // ── Step 1: referer-based detection ──────────────────────────────────────
  if (raw) {
    try {
      const hostname = new URL(raw).hostname.replace(/^www\./, "");
      const fullUrl  = raw;

      for (const [pattern, name] of PLATFORM_MAP) {
        if (pattern.test(hostname) || pattern.test(fullUrl)) {
          return { source: name, rawReferrer: raw };
        }
      }

      // Unknown external referrer — use cleaned hostname as label
      return { source: hostname || "External", rawReferrer: raw };
    } catch {
      // Malformed URL — return as-is
      return { source: "External", rawReferrer: raw };
    }
  }

  // ── Step 2: no referer — check User-Agent for WhatsApp's embedded browser ─
  // WhatsApp's in-app browser always includes "WhatsApp/" in its UA string.
  const ua = userAgentHeader?.trim() ?? "";
  if (/WhatsApp\//i.test(ua)) {
    return { source: "WhatsApp", rawReferrer: "" };
  }

  // ── Step 3: truly unknown / typed-in → Direct ────────────────────────────
  return { source: "Direct", rawReferrer: "" };
}
