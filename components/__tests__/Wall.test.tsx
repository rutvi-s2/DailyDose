import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
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

  it("opens the add-topic modal when 'Add topic' is clicked", async () => {
    render(<Wall />);
    await waitFor(() => expect(screen.getByText("NBA")).toBeDefined());
    // No dialog until the trigger is clicked.
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Add topic" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeDefined();
    // Modal exposes the topic + optional description fields.
    expect(screen.getByLabelText("Topic")).toBeDefined();
    expect(screen.getByLabelText(/what do you want to know/i)).toBeDefined();
  });

  it("asks for confirmation before deleting, and only deletes on confirm", async () => {
    const fetchMock = vi.fn(async (url: string, opts?: RequestInit) => {
      if (opts?.method === "DELETE") return new Response(null, { status: 204 });
      return new Response(JSON.stringify([
        { id: "t1", title: "NBA", description: null, createdAt: "2026-01-01T00:00:00Z" },
      ]), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<Wall />);
    await waitFor(() => expect(screen.getByText("NBA")).toBeDefined());

    // Clicking × opens a confirm dialog and does NOT delete yet.
    fireEvent.click(screen.getByRole("button", { name: "Delete NBA" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/are you sure/i)).toBeDefined();
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining("/api/topics/t1"),
      expect.objectContaining({ method: "DELETE" }),
    );

    // Confirming fires the DELETE and closes the dialog.
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/topics/t1",
        expect.objectContaining({ method: "DELETE" }),
      ),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("does not delete when the confirm dialog is cancelled", async () => {
    const fetchMock = vi.fn(async (url: string, opts?: RequestInit) => {
      if (opts?.method === "DELETE") return new Response(null, { status: 204 });
      return new Response(JSON.stringify([
        { id: "t1", title: "NBA", description: null, createdAt: "2026-01-01T00:00:00Z" },
      ]), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<Wall />);
    await waitFor(() => expect(screen.getByText("NBA")).toBeDefined());
    fireEvent.click(screen.getByRole("button", { name: "Delete NBA" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/topics/t1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("edits a topic's description via the pencil button", async () => {
    const fetchMock = vi.fn(async (url: string, opts?: RequestInit) => {
      if (opts?.method === "PATCH") return new Response(JSON.stringify({ ok: true }), { status: 200 });
      return new Response(JSON.stringify([
        { id: "t1", title: "NBA", description: "old focus", createdAt: "2026-01-01T00:00:00Z" },
      ]), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<Wall />);
    await waitFor(() => expect(screen.getByText("NBA")).toBeDefined());

    fireEvent.click(screen.getByRole("button", { name: "Edit NBA" }));
    const dialog = screen.getByRole("dialog");
    // The edit form is pre-filled with the current description.
    const field = within(dialog).getByLabelText(/what do you want to know/i) as HTMLTextAreaElement;
    expect(field.value).toBe("old focus");

    fireEvent.change(field, { target: { value: "new focus" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save changes" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/topics/t1",
        expect.objectContaining({ method: "PATCH" }),
      ),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("closes the modal after a topic is added", async () => {
    render(<Wall />);
    await waitFor(() => expect(screen.getByText("NBA")).toBeDefined());
    fireEvent.click(screen.getByRole("button", { name: "Add topic" }));
    fireEvent.change(screen.getByLabelText("Topic"), { target: { value: "F1" } });
    // Submit the form inside the dialog (the submit button, not the header trigger).
    const dialog = screen.getByRole("dialog");
    const submit = within(dialog).getByRole("button", { name: "Add topic" });
    fireEvent.click(submit);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});
