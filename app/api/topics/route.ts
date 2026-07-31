import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/session";

const createSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional(),
});

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid input" }, { status: 400 });
  }

  const topic = await prisma.topic.create({
    data: { userId, title: parsed.data.title, description: parsed.data.description ?? null },
  });
  return NextResponse.json(
    { id: topic.id, title: topic.title, description: topic.description, createdAt: topic.createdAt },
    { status: 201 },
  );
}

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const topics = await prisma.topic.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, description: true, createdAt: true },
  });
  return NextResponse.json(topics);
}
