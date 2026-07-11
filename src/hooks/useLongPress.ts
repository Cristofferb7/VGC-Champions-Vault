import { useCallback, useRef } from "react";

/** Movement past this cancels the press — it's a scroll, not a hold. */
const MOVE_TOLERANCE_PX = 10;

/**
 * Pointer handlers that fire `onLongPress` after `ms` of sustained press.
 * Release cancels; movement only cancels past a 10px tolerance so touch
 * jitter doesn't kill legit holds, while a real scroll attempt never pops
 * the menu (sprint 7 QA).
 */
export function useLongPress(onLongPress: () => void, ms = 500) {
  const timer = useRef<number | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);

  const cancel = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    origin.current = null;
  }, []);

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      cancel();
      origin.current = { x: event.clientX, y: event.clientY };
      timer.current = window.setTimeout(onLongPress, ms);
    },
    [onLongPress, ms, cancel],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (!origin.current) return;
      const dx = event.clientX - origin.current.x;
      const dy = event.clientY - origin.current.y;
      if (dx * dx + dy * dy > MOVE_TOLERANCE_PX ** 2) cancel();
    },
    [cancel],
  );

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: cancel,
    onPointerLeave: cancel,
    // Browser took over the gesture (e.g. scroll) — definitely not a hold.
    onPointerCancel: cancel,
  };
}
