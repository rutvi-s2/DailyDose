"use client";

import { useLayoutEffect, useRef } from "react";

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  value: string;
};

/**
 * A textarea that grows to fit its content as the user types. Height is reset
 * to auto then set to scrollHeight on every value change so it never scrolls
 * internally and shrinks back when text is removed.
 */
export function AutoTextarea({ value, className, ...rest }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return <textarea ref={ref} value={value} rows={1} className={className} {...rest} />;
}
