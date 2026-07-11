import { useEffect, useRef, useState } from "react";

/**
 * Tracks whether a horizontally scrollable element is at its start/end,
 * so the UI can show fade gradients as scroll affordances.
 */
export function useScrollEdges<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: true });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setEdges({
        atStart: el.scrollLeft <= 1,
        atEnd: el.scrollLeft >= max - 1,
      });
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  return { ref, ...edges };
}
