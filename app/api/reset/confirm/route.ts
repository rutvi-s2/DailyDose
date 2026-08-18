import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashResetToken, isResetTokenExpired } from "@/lib/reset";
import { hashPassword } from "@/lib/password";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const reason = parsed.error.issues[0]?.message ?? "Invalid input.";
    return NextResponse.json({ error: "invalid input", reason }, { status: 400 });
  }
  const { token, password } = parsed.data;

  const record = await prisma.verificationToken.findUnique({
    where: { token: hashResetToken(token) },
  });
  if (!record || isResetTokenExpired(record.expires)) {
    return NextResponse.json(
      { error: "invalid token", reason: "This reset link is invalid or has expired. Request a new one." },
      { status: 400 },
    );
  }

  // Update the password and consume the token so the link can't be reused.
  await prisma.user.update({
    where: { email: record.identifier },
    data: { passwordHash: await hashPassword(password) },
  });
  await prisma.verificationToken.deleteMany({ where: { identifier: record.identifier } });

  return NextResponse.json({ ok: true });
}
