import { prisma } from "@/lib/prisma";
import { parseReferrer } from "@/lib/referrer";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";

// ── Shared HTML shell ─────────────────────────────────────────────────────────
function htmlPage(icon: string, heading: string, body: string, code: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${heading} · FLCut</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,sans-serif;background:#fafaf7;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
    .card{background:#fff;border:1px solid #e8e6dd;border-radius:20px;padding:48px 40px;text-align:center;max-width:420px;width:100%;box-shadow:0 4px 24px rgba(15,23,42,0.08)}
    .icon{font-size:3rem;margin-bottom:16px}
    h1{font-size:1.5rem;font-weight:800;color:#0f172a;margin-bottom:10px;letter-spacing:-0.03em}
    p{color:#475569;font-size:0.9rem;line-height:1.65;margin-bottom:24px}
    code{background:#f5f4ef;border:1px solid #e8e6dd;border-radius:6px;padding:2px 8px;font-size:0.85rem;color:#d97706}
    .pill{display:inline-block;background:#f5f4ef;border:1px solid #e8e6dd;border-radius:100px;padding:5px 16px;font-size:0.8rem;font-weight:600;color:#334155;margin-bottom:20px}
    a{display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;text-decoration:none;border-radius:10px;padding:10px 20px;font-size:0.88rem;font-weight:600}
    a:hover{opacity:0.9}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <div class="pill"><code>${code}</code></div>
    <h1>${heading}</h1>
    <p>${body}</p>
    <a href="/">← Back to FLCut</a>
  </div>
</body>
</html>`;
}

// ── Cookie name used for visitor fingerprinting ───────────────────────────────
const VISITOR_COOKIE = "flcut_vid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  const { shortCode } = await params;

  if (!shortCode || shortCode.length > 50) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const link = await prisma.link.findFirst({
      where: {
        OR: [{ shortCode }, { customAlias: shortCode }],
      },
    });

    if (!link) {
      return new NextResponse(
        htmlPage(
          "🔗",
          "Link not found",
          `The short code <code>${shortCode}</code> doesn't exist or has been removed.`,
          shortCode
        ),
        { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    const now = new Date();

    // ── Scheduled activation check ────────────────────────────────────────
    if (link.activatesAt && now < link.activatesAt) {
      const activateStr = link.activatesAt.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      return new NextResponse(
        htmlPage(
          "⏳",
          "Link not active yet",
          `This link is scheduled to go live on <strong>${activateStr}</strong>. Please check back then!`,
          shortCode
        ),
        { status: 423, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // ── Expiry check ──────────────────────────────────────────────────────
    if (link.expiresAt && now > link.expiresAt) {
      const expiredStr = link.expiresAt.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      return new NextResponse(
        htmlPage(
          "⌛",
          "This link has expired",
          `This short link expired on <strong>${expiredStr}</strong> and is no longer active.`,
          shortCode
        ),
        { status: 410, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // ── Analytics: visitor cookie + referrer ──────────────────────────────
    const cookieStore = await cookies();
    const existingVid = cookieStore.get(VISITOR_COOKIE)?.value;
    const visitorId   = existingVid ?? randomUUID();

    // Unique = this visitor has never clicked THIS specific link before
    // We check the DB so uniqueness is scoped per-link, not per-browser globally.
    const previousClick = existingVid
      ? await prisma.click.findFirst({
          where:  { linkId: link.id, visitorId: existingVid },
          select: { id: true },
        })
      : null;
    const isUnique = !previousClick; // true on first click for this link

    const { source, rawReferrer } = parseReferrer(
      req.headers.get("referer"),
      req.headers.get("user-agent"),
    );

    // Fire-and-forget — don't block the redirect
    prisma.click
      .create({
        data: {
          linkId:    link.id,
          visitorId,
          isUnique,
          referrer:  rawReferrer || null,
          source,
        },
      })
      .catch((err) => console.error("[analytics] click write failed:", err));

    // Build redirect response and persist cookie for new visitors
    const redirectRes = NextResponse.redirect(link.originalUrl, { status: 308 });

    if (!existingVid) {
      // Set the cookie only once — on the very first visit from this browser
      redirectRes.cookies.set(VISITOR_COOKIE, visitorId, {
        httpOnly: true,
        sameSite: "lax",
        path:     "/",
        maxAge:   COOKIE_MAX_AGE,
      });
    }

    return redirectRes;
  } catch (error) {
    console.error("[redirect] DB error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
