"use client";

import { useEffect, useState } from "react";

type TypewriterTextProps = {
  text: string;
  speedMs?: number;
  className?: string;
};

export function TypewriterText({ text, speedMs = 24, className }: TypewriterTextProps) {
  const [visible, setVisible] = useState("");

  useEffect(() => {
    let i = 0;
    let timer: number | undefined;
    let cancelled = false;

    const typeNext = () => {
      if (cancelled) return;
      i += 1;
      setVisible(text.slice(0, i));
      if (i >= text.length) {
        return;
      }
      const currentChar = text[i - 1];
      const pauseMs = /[,.!?;:]/.test(currentChar) ? speedMs * 10 : speedMs;
      timer = window.setTimeout(typeNext, pauseMs);
    };

    timer = window.setTimeout(typeNext, speedMs);
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [speedMs, text]);

  return (
    <div className={`relative mx-auto w-fit text-left ${className ?? ""}`}>
      <p className="invisible whitespace-pre-wrap">{text}|</p>
      <p className="absolute inset-0 whitespace-pre-wrap">
        {visible}
        <span className="animate-pulse">|</span>
      </p>
    </div>
  );
}
