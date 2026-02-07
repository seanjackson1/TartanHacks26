"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function LoginButton() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
  };

  return (
    <button
      onClick={handleLogin}
      disabled={loading}
      className="relative group overflow-hidden w-full py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-3"
      style={{
        background: loading 
          ? "rgba(20, 27, 45, 0.8)" 
          : "linear-gradient(135deg, rgba(0, 242, 255, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
        opacity: loading ? 0.7 : 1,
        cursor: loading ? "wait" : "pointer",
        transform: loading ? "scale(1)" : undefined,
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          e.currentTarget.style.background = "linear-gradient(135deg, rgba(0, 242, 255, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)";
          e.currentTarget.style.borderColor = "rgba(0, 242, 255, 0.4)";
          e.currentTarget.style.boxShadow = "0 8px 30px rgba(0, 242, 255, 0.15)";
          e.currentTarget.style.transform = "scale(1.02)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "linear-gradient(135deg, rgba(0, 242, 255, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)";
        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.2)";
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {/* Cosmic Glow gradient overlay on hover */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: "linear-gradient(135deg, rgba(0, 242, 255, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)"
        }}
      />
      
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#00F2FF" }} />
      ) : (
        <img 
          src="https://authjs.dev/img/providers/google.svg" 
          alt="Google" 
          className="w-5 h-5 bg-white rounded-full p-0.5" 
        />
      )}
      
      <span className="font-semibold tracking-wide z-10" style={{ color: "#F1F5F9" }}>
        {loading ? "Connecting..." : "Continue with Google"}
      </span>
    </button>
  );
}

