import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { generateResetToken, hashResetToken, RESET_WINDOW_MS } from "@/lib/reset";
import { sendResetEmail } from "@/lib/email";

const schema = z.object({ email: z.string().email() });

function appUrl(): string {
  // Prefer an explicit APP_URL. On Vercel, fall back to the auto-provided
  // deployment host so reset links point at the live site even if APP_URL
  // isn't set. Local dev falls back to localhost.
  if (process.env.APP_URL) return process.env.APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  // Even on bad input we respond as if it succeeded — never reveal validity.
  if (!parsed.success) {
    return NextResponse.json({ ok: true });
  }
  const { email } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = generateResetToken();
    // Clear any prior tokens for this email, then store the new hashed one.
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: hashResetToken(token),
        expires: new Date(Date.now() + RESET_WINDOW_MS),
      },
    });
    const link = `${appUrl()}/reset/confirm?token=${token}`;
    await sendResetEmail(email, link);
  }

  // Anti-enumeration: identical response whether or not the account exists.
  return NextResponse.json({ ok: true });
}
