import { AnimatePresence, animate, motion, useMotionValue } from "motion/react";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/**
 * Mobile-native bottom sheet, constrained to the app's phone frame.
 * Docks above the bottom nav (which stays interactive at z-60): tapping
 * a nav tab while a sheet is open navigates, unmounting the sheet — one
 * gesture, per QA round 2. Dismiss via backdrop, X, or dragging the
 * handle down.
 */
export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  /** Drag offset while pulling the handle; springs back if not dismissed. */
  const dragY = useMotionValue(0);

  useEffect(() => {
    if (open) dragY.set(0);
  }, [open, dragY]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px]"
            style={{ x: "-50%" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            // Near-critically damped: no overshoot, so the close button
            // isn't moving when the user reaches for it (QA round 2).
            transition={{ type: "spring", damping: 34, stiffness: 360 }}
          >
            <motion.div
              style={{ y: dragY }}
              className="bg-panel border-t border-x border-white/10 rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.6)]"
            >
              {/* Drag region: handle + title row */}
              <motion.div
                onPan={(_, info) => dragY.set(Math.max(0, info.offset.y))}
                onPanEnd={(_, info) => {
                  if (info.offset.y > 90 || info.velocity.y > 600) {
                    onClose();
                  } else {
                    animate(dragY, 0, {
                      type: "spring",
                      damping: 30,
                      stiffness: 400,
                    });
                  }
                }}
                className="touch-none select-none cursor-grab active:cursor-grabbing"
              >
                <div className="flex justify-center pt-2.5">
                  <span className="w-9 h-1 rounded-full bg-white/15" />
                </div>
                <div className="flex items-center justify-between pl-4 pr-1.5 pb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink">
                    {title}
                  </span>
                  {/* 44px hit area (QA round 2: X kept missing on tap) */}
                  <button
                    onClick={onClose}
                    aria-label="Close"
                    className="w-11 h-11 flex items-center justify-center text-muted hover:text-ink transition-colors"
                  >
                    <span className="p-1.5 rounded-lg bg-night border border-white/5">
                      <X size={14} className="block" />
                    </span>
                  </button>
                </div>
              </motion.div>
              {/* pb clears the bottom nav (72px) + safe area */}
              <div
                className="px-4 max-h-[62vh] overflow-y-auto"
                style={{
                  paddingBottom: "calc(88px + env(safe-area-inset-bottom))",
                }}
              >
                {children}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
