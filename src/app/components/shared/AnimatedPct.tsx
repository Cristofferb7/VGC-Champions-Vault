import { useEffect, useRef } from "react";
import { animate } from "motion/react";

interface AnimatedPctProps {
  value: number;
  className?: string;
}

/** Percentage that counts up on mount (e.g. "52.9% WIN" in detail sheets). */
export function AnimatedPct({ value, className }: AnimatedPctProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const controls = animate(0, value, {
      duration: 0.6,
      ease: "easeOut",
      onUpdate: (latest) => {
        el.textContent = `${latest.toFixed(1)}%`;
      },
    });
    return () => controls.stop();
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {value.toFixed(1)}%
    </span>
  );
}
