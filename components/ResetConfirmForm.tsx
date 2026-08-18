"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./AuthForm.module.css";

export function ResetConfirmForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/reset/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.reason ?? "Couldn't reset your password. Please try again.");
      return;
    }
    setDone(true);
  }

  if (!token) {
    return (
      <div className={styles.form}>
        <h1>Invalid link</h1>
        <p role="alert" className={styles.error}>
          This reset link is missing its token. Request a new one.
        </p>
        <Link href="/reset">Request a new link</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className={styles.form}>
        <h1>Password updated</h1>
        <p role="status">You can now sign in with your new password.</p>
        <Link href="/login">Go to sign in</Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <h1>Choose a new password</h1>
      <input
        type="password"
        placeholder="New password"
        value={password}
        required
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <button type="submit">Reset password</button>
      <Link href="/login">← Back to sign in</Link>
    </form>
  );
}
