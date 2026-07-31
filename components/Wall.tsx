"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AddTopicForm } from "@/components/AddTopicForm";

type Topic = { id: string; title: string; description: string | null; createdAt: string };

export function Wall() {
  const [topics, setTopics] = useState<Topic[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/topics");
    if (res.ok) setTopics(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: string) {
    const res = await fetch(`/api/topics/${id}`, { method: "DELETE" });
    if (res.ok) setTopics((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div>
      <h1>Your wall</h1>
      <AddTopicForm onAdded={load} />
      <ul>
        {topics.map((t) => (
          <li key={t.id}>
            <Link href={`/topic/${t.id}`}>{t.title}</Link>
            {t.description && <span> — {t.description}</span>}
            <button aria-label={`Delete ${t.title}`} onClick={() => remove(t.id)}>×</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
