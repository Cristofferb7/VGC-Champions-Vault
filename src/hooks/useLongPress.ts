import { useCallback, useRef } from "react";

/**
 * Pointer handlers that fire `onLongPress` after `ms` of sustained press.
 * Movement or release cancels the timer (a scroll is not a long press).
 */
export function useLongPress(onLongPress: () => void, ms = 500) {
  const timer = useRef<number | null>(null);

  const cancel = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const onPointerDown = useCallback(() => {
    cancel();
    timer.current = window.setTimeout(onLongPress, ms);
  }, [onLongPress, ms, cancel]);

  return {
    onPointerDown,
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerMove: cancel,
  };
}
