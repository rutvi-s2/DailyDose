import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { generateBriefing, type Source } from "@/lib/briefing";
import { isFresh } from "@/lib/freshness";
import { isUnderCap } from "@/lib/cap";

type Ctx = { params: Promise<{ id: string }> };

function serve(
  content: string | null,
  sources: Source[],
  generatedAt: Date | null,
  cached: boolean,
  limitReached: boolean,
) {
  return NextResponse.json({
    content,
    sources,
    generatedAt: generatedAt ? generatedAt.toISOString() : null,
    cached,
    limitReached,
  });
}

export async function GET(request: Request, { params }: Ctx) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const topic = await prisma.topic.findFirst({ where: { id, userId } });
  if (!topic) return NextResponse.json({ error: "not found" }, { status: 404 });

  const refresh = new URL(request.url).searchParams.get("refresh") === "true";

  const latest = await prisma.briefing.findFirst({
    where: { topicId: id },
    orderBy: { generatedAt: "desc" },
  });

  const cachedSources = (latest?.sources as Source[] | null) ?? [];

  // Serve fresh cache unless a refresh was explicitly requested.
  if (!refresh && latest && isFresh(latest.generatedAt)) {
    return serve(latest.content, cachedSources, latest.generatedAt, true, false);
  }

  // Need to generate — enforce the daily cap first.
  if (!(await isUnderCap(userId))) {
    if (latest) {
      return serve(latest.content, cachedSources, latest.generatedAt, true, true);
    }
    return serve(null, [], null, false, true);
  }

  let generated;
  try {
    generated = await generateBriefing(topic.title, topic.description);
  } catch {
    return NextResponse.json({ error: "generation failed" }, { status: 502 });
  }

  const row = await prisma.briefing.create({
    data: {
      topicId: id,
      content: generated.content,
      sources: generated.sources as unknown as object,
    },
  });
  return serve(row.content, generated.sources, row.generatedAt, false, false);
}
