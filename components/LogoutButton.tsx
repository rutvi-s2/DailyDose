"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button className="btn-ghost" onClick={() => signOut({ callbackUrl: "/login" })}>
      Log out
    </button>
  );
}
