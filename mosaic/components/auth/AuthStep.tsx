"use client";

import { motion } from "framer-motion";
import LoginButton from "./LoginButton";

export default function AuthStep() {
  return (
    <div className="mosaic-card flex flex-col items-center justify-center p-10 space-y-8 max-w-md w-full text-center relative z-10">
      <div className="space-y-3">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent"
          style={{
            backgroundImage: "linear-gradient(135deg, #00F2FF 0%, #8B5CF6 25%, #FF007A 50%, #FBBF24 75%, #ADFF2F 100%)",
            backgroundSize: "200% 200%",
            animation: "rainbow-shift 8s ease infinite",
          }}
        >
          Global Mosaic
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg font-medium"
          style={{ 
            background: "linear-gradient(90deg, #00F2FF, #8B5CF6, #FF007A)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            opacity: 0.8,
          }}
        >
          Enter as individuals. Leave as a community
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full"
      >
        <LoginButton />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        style={{ color: "#64748B" }}
        className="text-xs max-w-xs mx-auto"
      >
        By continuing, you agree to connect with people different from you.
      </motion.p>

      <style jsx>{`
        .mosaic-card {
          background: linear-gradient(
            180deg, 
            rgba(10, 14, 23, 0.97), 
            rgba(20, 27, 45, 0.95)
          );
          border: 1px solid rgba(30, 41, 59, 0.6);
          box-shadow: 
            0 10px 40px rgba(10, 14, 23, 0.7),
            0 0 80px rgba(0, 242, 255, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.03);
          border-radius: 24px;
        }

        @keyframes rainbow-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      `}</style>
    </div>
  );
}
