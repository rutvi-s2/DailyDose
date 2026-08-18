"use client";

import { useEffect, useRef } from "react";
import styles from "./Modal.module.css";

type ModalProps = {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function Modal({ title, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Focus the first focusable field when the modal opens.
  useEffect(() => {
    dialogRef.current
      ?.querySelector<HTMLElement>("input, button, textarea, select")
      ?.focus();
  }, []);

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(e) => {
        // Only close when the backdrop itself is clicked, not the dialog.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <button className={styles.close} aria-label="Close" onClick={onClose}>
          ×
        </button>
        <h2 className={styles.title}>{title}</h2>
        {children}
      </div>
    </div>
  );
}
