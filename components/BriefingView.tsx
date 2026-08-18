"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import styles from "./BriefingView.module.css";

type Source = { title: string; url: string };
type Briefing = {
  content: string | null;
  sources: Source[];
  generatedAt: string | null;
  cached: boolean;
  limitReached: boolean;
};

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  return `${hrs}h ago`;
}

export function BriefingView({ topicId }: { topicId: string }) {
  const [data, setData] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async (refresh: boolean) => {
    setLoading(true);
    setError(false);
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const params = new URLSearchParams({ tz });
    if (refresh) params.set("refresh", "true");
    const url = `/api/topics/${topicId}/briefing?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
      setError(true);
      setLoading(false);
      return;
    }
    setData(await res.json());
    setLoading(false);
  }, [topicId]);

  useEffect(() => {
    load(false);
  }, [load]);

  return (
    <div>
      <div className={styles.toolbar}>
        <Link href="/" className={styles.back}>← Back to wall</Link>
        <button className="btn-ghost" onClick={() => load(true)} disabled={loading}>Refresh</button>
      </div>

      {loading && (
        <div className={styles.loading}>
          <p className={styles.loadingLabel}>Generating your briefing…</p>
          <div
            className={styles.track}
            role="progressbar"
            aria-label="Generating briefing"
          >
            <div className={styles.bar} />
          </div>
        </div>
      )}
      {error && <p role="alert" className={styles.error}>Couldn&apos;t generate — try again.</p>}

      {data?.limitReached && (
        <p role="status">Daily limit reached — try again tomorrow.</p>
      )}

      {data?.content && (
        <>
          <p className={styles.meta}>Generated {timeAgo(data.generatedAt)}</p>
          <ReactMarkdown>{data.content}</ReactMarkdown>
          {data.sources.length > 0 && (
            <section className={styles.sources}>
              <h2>Sources</h2>
              <ul>
                {data.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
