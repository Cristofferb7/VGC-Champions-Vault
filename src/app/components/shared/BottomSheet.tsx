import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import type { ReactNode } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/** Mobile-native bottom sheet, constrained to the app's phone frame. */
export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
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
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <div className="bg-panel border-t border-x border-white/10 rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.6)] pb-safe">
              <div className="flex justify-center pt-2.5">
                <span className="w-9 h-1 rounded-full bg-white/15" />
              </div>
              <div className="flex items-center justify-between px-4 pt-2 pb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink">
                  {title}
                </span>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="p-1.5 rounded-lg bg-night border border-white/5 text-muted hover:text-ink transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="px-4 pb-4 max-h-[65vh] overflow-y-auto">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
