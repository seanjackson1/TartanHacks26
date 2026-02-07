"use client";

import { motion } from "framer-motion";
import LoginButton from "./LoginButton";

export default function AuthStep() {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-8 max-w-md w-full text-center">
      <div className="space-y-2">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--cyan)] to-[var(--magenta)]"
        >
          Global Mosaic
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-white/60"
        >
          Discover your people. Bridge the divide.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
      >
        <LoginButton />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-xs text-white/30 max-w-xs mx-auto"
      >
        By continuing, you agree to connect with people different from you.
      </motion.p>
    </div>
  );
}
