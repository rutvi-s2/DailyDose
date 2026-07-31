"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export function AuthForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === "signup") {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        setError(res.status === 409 ? "Email already registered" : "Signup failed");
        return;
      }
    }
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) setError("Invalid email or password");
    else window.location.href = "/";
  }

  return (
    <form onSubmit={onSubmit}>
      <h1>Wassup</h1>
      <input
        type="email" placeholder="Email" value={email} required
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password" placeholder="Password" value={password} required
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p role="alert">{error}</p>}
      <button type="submit">{mode === "signin" ? "Sign in" : "Create account"}</button>
      <button
        type="button"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
      >
        {mode === "signin" ? "Create account" : "Have an account? Sign in"}
      </button>
    </form>
  );
}
