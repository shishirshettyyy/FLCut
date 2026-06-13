import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const linkId = parseInt(id, 10);

  if (isNaN(linkId)) {
    return NextResponse.json({ error: "Invalid link id" }, { status: 400 });
  }

  try {
    // Aggregate counts
    const [totalClicks, uniqueClicks] = await Promise.all([
      prisma.click.count({ where: { linkId } }),
      prisma.click.count({ where: { linkId, isUnique: true } }),
    ]);

    // Referrer / source breakdown — group by source, order by count desc
    const sourcesRaw = await prisma.click.groupBy({
      by: ["source"],
      where: { linkId },
      _count: { source: true },
      orderBy: { _count: { source: "desc" } },
    });

    const sources = sourcesRaw.map((row) => ({
      source: row.source,
      count:  row._count.source,
    }));

    return NextResponse.json({ totalClicks, uniqueClicks, sources });
  } catch (error) {
    console.error("[analytics] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics: " + String(error) },
      { status: 500 }
    );
  }
}
