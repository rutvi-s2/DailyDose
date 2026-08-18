"use client";

import { useState } from "react";
import { AutoTextarea } from "@/components/AutoTextarea";
import styles from "./AddTopicForm.module.css";

type Props = {
  topicId: string;
  title: string;
  initialDescription: string;
  onSaved: () => void;
};

export function EditTopicForm({ topicId, title, initialDescription, onSaved }: Props) {
  const [description, setDescription] = useState(initialDescription);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/topics/${topicId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ description: description || null }),
    });
    setSaving(false);
    if (res.ok) onSaved();
  }

  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <div className={styles.field}>
        <span className={styles.label}>Topic</span>
        <p style={{ margin: 0 }}>{title}</p>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="edit-description">
          What do you want to know? <span className={styles.optional}>(optional)</span>
        </label>
        <AutoTextarea
          id="edit-description"
          placeholder="e.g. trades and injury news"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <button type="submit" className={styles.submit} disabled={saving}>
        Save changes
      </button>
    </form>
  );
}
