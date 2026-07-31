import { prisma } from "@/lib/db";

export const DAILY_CAP = 10;

function startOfLocalDay(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function countGenerationsToday(userId: string, now: Date = new Date()): Promise<number> {
  return prisma.briefing.count({
    where: {
      topic: { userId },
      generatedAt: { gte: startOfLocalDay(now) },
    },
  });
}

export async function isUnderCap(userId: string, now: Date = new Date()): Promise<boolean> {
  return (await countGenerationsToday(userId, now)) < DAILY_CAP;
}
