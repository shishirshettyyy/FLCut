import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const linkId = parseInt(id, 10);

  if (isNaN(linkId)) {
    return NextResponse.json({ error: "Invalid link id" }, { status: 400 });
  }

  try {
    const body = await req.json();

    // Accept expiresAt and activatesAt — both can be a date string or null to clear
    const expiresAt: Date | null =
      body.expiresAt ? new Date(body.expiresAt) : null;
    const activatesAt: Date | null =
      body.activatesAt ? new Date(body.activatesAt) : null;

    // Validate: activatesAt must be before expiresAt if both are set
    if (expiresAt && activatesAt && activatesAt >= expiresAt) {
      return NextResponse.json(
        { error: "Activation date must be before the expiry date." },
        { status: 400 }
      );
    }

    const updated = await prisma.link.update({
      where: { id: linkId },
      data: { expiresAt, activatesAt },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[patch] DB error:", error);
    return NextResponse.json(
      { error: "Failed to update link: " + String(error) },
      { status: 500 }
    );
  }
}

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
