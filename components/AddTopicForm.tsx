"use client";

import { useState } from "react";

export function AddTopicForm({ onAdded }: { onAdded: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const res = await fetch("/api/topics", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, description: description || undefined }),
    });
    if (res.ok) {
      setTitle("");
      setDescription("");
      onAdded();
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <input
        placeholder="Topic (e.g. NBA)" value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        placeholder="What do you want to know? (optional)" value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <button type="submit">+ Add topic</button>
    </form>
  );
}
