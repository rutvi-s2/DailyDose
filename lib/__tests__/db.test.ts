import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";

describe("prisma client", () => {
  it("exposes the app models", () => {
    expect(prisma.user).toBeDefined();
    expect(prisma.topic).toBeDefined();
    expect(prisma.briefing).toBeDefined();
  });
});
