"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";

export default function LoadingOverlay() {
  const { isLoading, loadingMessage } = useAppStore();

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm"
        >
          {/* Pulsing radar circles */}
          <div className="relative w-32 h-32">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border border-cyan/40"
                animate={{
                  scale: [1, 2.5],
                  opacity: [0.6, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.6,
                  ease: "easeOut",
                }}
              />
            ))}
            {/* Center dot */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-3 h-3 rounded-full bg-cyan"
                style={{ boxShadow: "0 0 20px var(--cyan)" }}
              />
            </div>
          </div>

          <motion.p
            className="mt-8 text-lg font-mono text-cyan tracking-widest"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {loadingMessage || "Scanning Humanity..."}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
