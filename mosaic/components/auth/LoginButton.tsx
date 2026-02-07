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
      className={`
        relative group overflow-hidden px-8 py-4 rounded-full 
        bg-white/10 hover:bg-white/20 border border-white/20 
        backdrop-blur-md transition-all duration-300
        flex items-center gap-3
        ${loading ? "opacity-70 cursor-wait" : "hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"}
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin text-white/80" />
      ) : (
        <img 
          src="https://authjs.dev/img/providers/google.svg" 
          alt="Google" 
          className="w-5 h-5 bg-white rounded-full p-0.5" 
        />
      )}
      
      <span className="font-semibold text-white tracking-wide z-10">
        {loading ? "Connecting..." : "Continue with Google"}
      </span>
    </button>
  );
}
