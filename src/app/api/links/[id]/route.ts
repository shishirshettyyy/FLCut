import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const linkId = parseInt(id, 10);

  if (isNaN(linkId)) {
    return NextResponse.json({ error: "Invalid link id" }, { status: 400 });
  }

  try {
    // Clicks are cascade-deleted by the schema (onDelete: Cascade)
    await prisma.link.delete({ where: { id: linkId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[delete] DB error:", error);
    return NextResponse.json(
      { error: "Failed to delete link: " + String(error) },
      { status: 500 }
    );
  }
}
