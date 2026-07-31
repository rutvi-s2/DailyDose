import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next-auth/react", () => ({ signIn: vi.fn() }));

import { AuthForm } from "@/components/AuthForm";

describe("AuthForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders sign-in mode by default", () => {
    render(<AuthForm />);
    expect(screen.getByRole("button", { name: /sign in/i })).toBeDefined();
  });

  it("toggles to create-account mode", () => {
    render(<AuthForm />);
    fireEvent.click(screen.getByText(/create account/i));
    expect(screen.getByRole("button", { name: /create account/i })).toBeDefined();
  });
});
