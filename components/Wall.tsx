"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AddTopicForm } from "@/components/AddTopicForm";
import { EditTopicForm } from "@/components/EditTopicForm";
import { LogoutButton } from "@/components/LogoutButton";
import { Masthead } from "@/components/Masthead";
import { Modal } from "@/components/Modal";
import styles from "./Wall.module.css";

type Topic = { id: string; title: string; description: string | null; createdAt: string };

export function Wall() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Topic | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Topic | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/topics");
    if (res.ok) setTopics(await res.json());
    setLoaded(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function confirmDelete() {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    const res = await fetch(`/api/topics/${id}`, { method: "DELETE" });
    if (res.ok) setTopics((prev) => prev.filter((t) => t.id !== id));
    setPendingDelete(null);
  }

  // Refresh the grid and close the modal after a successful add.
  async function handleAdded() {
    await load();
    setAdding(false);
  }

  // Refresh the grid and close the edit modal after a successful save.
  async function handleSaved() {
    await load();
    setEditing(null);
  }

  return (
    <div>
      <Masthead />

      <div className={styles.toolbar}>
        <button onClick={() => setAdding(true)}>Add topic</button>
        <LogoutButton />
      </div>

      {adding && (
        <Modal title="Add topic" onClose={() => setAdding(false)}>
          <AddTopicForm onAdded={handleAdded} />
        </Modal>
      )}

      {editing && (
        <Modal title="Edit topic" onClose={() => setEditing(null)}>
          <EditTopicForm
            topicId={editing.id}
            title={editing.title}
            initialDescription={editing.description ?? ""}
            onSaved={handleSaved}
          />
        </Modal>
      )}

      {pendingDelete && (
        <Modal title="Delete topic?" onClose={() => setPendingDelete(null)}>
          <p className={styles.confirmText}>
            Are you sure you want to delete <strong>{pendingDelete.title}</strong>? This can&apos;t be undone.
          </p>
          <div className={styles.confirmActions}>
            <button className="btn-ghost" onClick={() => setPendingDelete(null)}>
              Cancel
            </button>
            <button className={styles.confirmDelete} onClick={confirmDelete}>
              Delete
            </button>
          </div>
        </Modal>
      )}

      {!loaded ? (
        <div className={styles.loading}>
          <div className={styles.spinner} role="status" aria-label="Loading topics" />
        </div>
      ) : topics.length === 0 ? (
        <p className={styles.empty}>No topics yet — add one above to get your first briefing.</p>
      ) : (
        <ul className={styles.grid}>
          {topics.map((t) => (
            <li key={t.id} className={styles.tile}>
              <Link href={`/topic/${t.id}`} className={styles.tileLink}>
                <div className={styles.title}>{t.title}</div>
                {t.description && <p className={styles.desc}>{t.description}</p>}
              </Link>
              <div className={styles.tileActions}>
                <button
                  className={styles.edit}
                  aria-label={`Edit ${t.title}`}
                  onClick={() => setEditing(t)}
                >
                  ✎
                </button>
                <button
                  className={styles.delete}
                  aria-label={`Delete ${t.title}`}
                  onClick={() => setPendingDelete(t)}
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
