"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import styles from "./AuthForm.module.css";

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
        const data = await res.json().catch(() => null);
        setError(data?.reason ?? "Signup failed. Please try again.");
        return;
      }
    }
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) setError("Invalid email or password");
    else window.location.href = "/";
  }

  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <h1>DailyDose</h1>
      <input
        type="email" placeholder="Email" value={email} required
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password" placeholder="Password" value={password} required
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <button type="submit">{mode === "signin" ? "Sign in" : "Create account"}</button>
      <button
        type="button"
        className={styles.switch}
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
      >
        {mode === "signin" ? "Create account" : "Have an account? Sign in"}
      </button>
      {mode === "signin" && (
        <Link href="/reset" className={styles.forgot}>
          Forgot password?
        </Link>
      )}
    </form>
  );
}
