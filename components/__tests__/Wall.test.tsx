import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { Wall } from "@/components/Wall";

beforeEach(() => {
  vi.restoreAllMocks();
  vi.stubGlobal("fetch", vi.fn(async () =>
    new Response(JSON.stringify([
      { id: "t1", title: "NBA", description: null, createdAt: "2026-01-01T00:00:00Z" },
    ]), { status: 200 }),
  ));
});

describe("Wall", () => {
  it("renders topics fetched from the API", async () => {
    render(<Wall />);
    await waitFor(() => expect(screen.getByText("NBA")).toBeDefined());
  });
});
