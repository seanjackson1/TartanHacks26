"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Check, Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/constants";

interface Props {
    provider: "youtube" | "steam" | "spotify" | "github";
    label: string;
    icon?: React.ReactNode;
}

export default function PlatformConnectButton({ provider, label, icon }: Props) {
    const [loading, setLoading] = useState(false);
    const [connected, setConnected] = useState(false);

    const handleConnect = () => {
        setLoading(true);
        
        // CRITICAL: Open window synchronously on click to avoid popup blockers on iOS Safari
        // Must be called directly in the click handler, not after any async operation
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        
        // Open with about:blank immediately, we'll set the real URL after getting the session
        const authWindow = window.open(
            'about:blank',
            `${provider}_oauth`,
            `width=${width},height=${height},left=${left},top=${top}`
        );

        // Now do async work
        (async () => {
            try {
                // Get the current user's Supabase UUID
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user?.id) {
                    console.error("No user session found");
                    authWindow?.close();
                    setLoading(false);
                    return;
                }

                const userId = session.user.id;
                const authUrl = `${API_BASE_URL}/auth/${provider}/start?user_id=${userId}`;

                // Navigate the already-open window to the auth URL
                if (authWindow && !authWindow.closed) {
                    authWindow.location.href = authUrl;
                } else {
                    // Window was closed or blocked, fall back to same-page navigation
                    window.location.href = authUrl;
                    return;
                }

                // Poll for window close (OAuth callback will close it)
                const pollTimer = setInterval(() => {
                    if (authWindow?.closed) {
                        clearInterval(pollTimer);
                        setConnected(true);
                        setLoading(false);
                    }
                }, 500);

                // Timeout after 5 minutes
                setTimeout(() => {
                    clearInterval(pollTimer);
                    if (!authWindow?.closed) {
                        authWindow?.close();
                    }
                    setLoading(false);
                }, 5 * 60 * 1000);

            } catch (error) {
                console.error("OAuth connect failed:", error);
                authWindow?.close();
                setLoading(false);
            }
        })();
    };

    if (connected) {
        return (
            <div 
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{
                background: "rgba(34, 197, 94, 0.1)",
                border: "1px solid rgba(34, 197, 94, 0.3)",
                color: "#22C55E"
              }}
            >
                <Check className="w-4 h-4" />
                <span className="text-sm">{label} connected</span>
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={handleConnect}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-wait"
            style={{
              background: "rgba(20, 27, 45, 0.6)",
              border: "1px solid #1E293B",
              color: loading ? "#64748B" : "#F1F5F9",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = "rgba(0, 242, 255, 0.08)";
                e.currentTarget.style.borderColor = "#00F2FF";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(20, 27, 45, 0.6)";
              e.currentTarget.style.borderColor = "#1E293B";
            }}
        >
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                icon
            )}
            <span className="text-sm">
                {loading ? "Connecting..." : `Connect ${label}`}
            </span>
        </button>
    );
}
