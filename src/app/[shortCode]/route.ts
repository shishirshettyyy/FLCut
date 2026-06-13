import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  const { shortCode } = await params;

  // Guard against empty / obviously invalid codes
  if (!shortCode || shortCode.length > 20) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const link = await prisma.link.findUnique({
      where: { shortCode },
    });

    if (!link) {
      // Return a friendly 404 response
      return new NextResponse(
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Link not found · FLCut</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,sans-serif;background:#fafaf7;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
    .card{background:#fff;border:1px solid #e8e6dd;border-radius:20px;padding:48px 40px;text-align:center;max-width:400px;width:100%}
    .icon{font-size:3rem;margin-bottom:16px}
    h1{font-size:1.5rem;font-weight:800;color:#0f172a;margin-bottom:8px;letter-spacing:-0.03em}
    p{color:#475569;font-size:0.9rem;line-height:1.6;margin-bottom:24px}
    code{background:#f5f4ef;border:1px solid #e8e6dd;border-radius:6px;padding:2px 8px;font-size:0.85rem;color:#d97706}
    a{display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;text-decoration:none;border-radius:10px;padding:10px 20px;font-size:0.88rem;font-weight:600}
    a:hover{opacity:0.9}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🔗</div>
    <h1>Link not found</h1>
    <p>The short code <code>${shortCode}</code> doesn't exist or has been removed.</p>
    <a href="/">← Back to FLCut</a>
  </div>
</body>
</html>`,
        {
          status: 404,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      );
    }

    // 308 = Permanent Redirect (preserves method; ideal for link shorteners)
    return NextResponse.redirect(link.originalUrl, { status: 308 });
  } catch (error) {
    console.error("[redirect] DB error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
