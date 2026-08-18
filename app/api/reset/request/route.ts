import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { generateResetToken, hashResetToken, RESET_WINDOW_MS } from "@/lib/reset";
import { sendResetEmail } from "@/lib/email";

const schema = z.object({ email: z.string().email() });

function appUrl(): string {
  return process.env.APP_URL ?? "http://localhost:3000";
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
