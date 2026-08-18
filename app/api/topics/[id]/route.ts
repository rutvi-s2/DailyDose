import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  description: z.string().trim().max(2000).nullable().optional(),
});

export async function PATCH(request: Request, { params }: Ctx) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid input" }, { status: 400 });
  }
  const description = parsed.data.description?.trim() || null;

  // Scope the update to the owner; updateMany reports how many rows matched.
  const result = await prisma.topic.updateMany({
    where: { id, userId },
    data: { description },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // The description drives what the briefing focuses on, so drop cached
  // briefings; the next open regenerates with the new focus.
  await prisma.briefing.deleteMany({ where: { topicId: id } });

  return NextResponse.json({ id, description });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await prisma.topic.deleteMany({ where: { id, userId } });
  if (result.count === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
