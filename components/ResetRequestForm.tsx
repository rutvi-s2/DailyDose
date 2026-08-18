"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./AuthForm.module.css";

export function ResetRequestForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/reset/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    // Always show the same confirmation, regardless of whether the email exists.
    setSent(true);
  }

  if (sent) {
    return (
      <div className={styles.form}>
        <h1>Check your email</h1>
        <p role="status">
          If an account exists for <strong>{email}</strong>, we&apos;ve sent a link to
          reset your password. The link is valid for one hour.
        </p>
        <Link href="/login">← Back to sign in</Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <h1>Reset password</h1>
      <p>Enter your email and we&apos;ll send you a reset link.</p>
      <input
        type="email"
        placeholder="Email"
        value={email}
        required
        onChange={(e) => setEmail(e.target.value)}
      />
      <button type="submit">Send reset link</button>
      <Link href="/login">← Back to sign in</Link>
    </form>
  );
}
