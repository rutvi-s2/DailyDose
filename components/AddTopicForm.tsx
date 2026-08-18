"use client";

import { useState } from "react";
import { AutoTextarea } from "@/components/AutoTextarea";
import styles from "./AddTopicForm.module.css";

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
    <form onSubmit={onSubmit} className={styles.form}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="topic-title">
          Topic
        </label>
        <input
          id="topic-title"
          placeholder="e.g. NBA"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="topic-description">
          What do you want to know? <span className={styles.optional}>(optional)</span>
        </label>
        <AutoTextarea
          id="topic-description"
          placeholder="e.g. trades and injury news"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <button type="submit" className={styles.submit}>
        Add topic
      </button>
    </form>
  );
}
