import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/** Words that cannot be used as custom aliases — they conflict with app routes */
const RESERVED_WORDS = [
  "api",
  "admin",
  "dashboard",
  "analytics",
  "settings",
  "login",
  "register",
  "help",
  "about",
];

/** Only allow alphanumeric + hyphens, 2–30 chars */
const ALIAS_RE = /^[a-z0-9-]{2,30}$/i;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.originalUrl) {
      return NextResponse.json(
        { error: "originalUrl is required" },
        { status: 400 }
      );
    }

    // ── Custom alias validation ──────────────────────────────────────────
    let shortCode: string;

    if (body.customAlias && body.customAlias.trim() !== "") {
      const alias = body.customAlias.trim().toLowerCase();

      // Check character rules
      if (!ALIAS_RE.test(alias)) {
        return NextResponse.json(
          {
            error:
              "Alias may only contain letters, numbers, and hyphens (2–30 characters).",
          },
          { status: 400 }
        );
      }

      // Check reserved words
      if (RESERVED_WORDS.includes(alias)) {
        return NextResponse.json(
          {
            error: `"${alias}" is a reserved word and cannot be used as an alias.`,
            reserved: true,
          },
          { status: 400 }
        );
      }

      // Check uniqueness
      const existing = await prisma.link.findFirst({
        where: { OR: [{ shortCode: alias }, { customAlias: alias }] },
      });
      if (existing) {
        return NextResponse.json(
          { error: `The alias "${alias}" is already taken. Choose another.` },
          { status: 409 }
        );
      }

      shortCode = alias;
    } else {
      // Auto-generate a 6-char code (retry on collision)
      let attempts = 0;
      do {
        shortCode = Math.random().toString(36).substring(2, 8);
        attempts++;
        if (attempts > 10) throw new Error("Could not generate unique code");
      } while (
        await prisma.link.findUnique({ where: { shortCode } })
      );
    }

    // ── Date fields ──────────────────────────────────────────────────────
    const expiresAt: Date | null = body.expiresAt
      ? new Date(body.expiresAt)
      : null;
    const activatesAt: Date | null = body.activatesAt
      ? new Date(body.activatesAt)
      : null;

    if (expiresAt && activatesAt && activatesAt >= expiresAt) {
      return NextResponse.json(
        { error: "Activation date must be before the expiry date." },
        { status: 400 }
      );
    }

    // ── Persist ──────────────────────────────────────────────────────────
    const link = await prisma.link.create({
      data: {
        originalUrl: body.originalUrl,
        shortCode,
        customAlias: body.customAlias?.trim() || null,
        expiresAt,
        activatesAt,
      },
    });

    return NextResponse.json(link);
  } catch (error) {
    console.error("Error creating link:", error);
    return NextResponse.json(
      { error: "Failed to create link: " + String(error) },
      { status: 500 }
    );
  }
}