import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";

const schema = z.object({
  email: z.string().email({ message: "Enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  name: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    // Surface the first specific validation message so the UI can explain why.
    const reason = parsed.error.issues[0]?.message ?? "Invalid input.";
    return NextResponse.json({ error: "invalid input", reason }, { status: 400 });
  }
  const { email, password, name } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "email already registered", reason: "That email is already registered. Try signing in instead." },
      { status: 409 },
    );
  }

  const user = await prisma.user.create({
    data: { email, name, passwordHash: await hashPassword(password) },
  });
  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
}
