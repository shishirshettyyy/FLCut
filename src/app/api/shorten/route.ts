import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.originalUrl) {
      return NextResponse.json(
        { error: "originalUrl is required" },
        { status: 400 }
      );
    }

    const shortCode = Math.random().toString(36).substring(2, 8);

    const link = await prisma.link.create({
      data: {
        originalUrl: body.originalUrl,
        shortCode,
      },
    });

    return NextResponse.json(link);
  } catch (error) {
    console.error("Error creating link:", error);
    return NextResponse.json(
      {
        error: "Failed to create link: " + String(error),
      },
      {
        status: 500,
      }
    );
  }
}