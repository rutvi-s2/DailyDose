"use client";

import { useEffect, useState } from "react";
import styles from "./Masthead.module.css";

export function Masthead() {
  // Render the date client-side so it reflects the reader's locale/timezone
  // and never mismatches between server and client.
  const [today, setToday] = useState("");
  useEffect(() => {
    setToday(
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    );
  }, []);

  return (
    <header className={styles.masthead}>
      <h1 className={styles.title}>DailyDose</h1>
      <p className={styles.dateline}>
        <span>{today || "Your daily briefings"}</span>
      </p>
    </header>
  );
}
