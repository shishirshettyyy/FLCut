import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const links = await prisma.link.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(links);
  } catch (error) {
    console.error("Error fetching links:", error);
    return NextResponse.json(
      { error: "Failed to fetch links: " + String(error) },
      { status: 500 }
    );
  }
}
