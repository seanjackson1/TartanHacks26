"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Check, Loader2 } from "lucide-react";

interface Props {
    provider: "youtube" | "steam" | "spotify" | "github";
    label: string;
    icon?: React.ReactNode;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function PlatformConnectButton({ provider, label, icon }: Props) {
    const [loading, setLoading] = useState(false);
    const [connected, setConnected] = useState(false);

    const handleConnect = async () => {
        setLoading(true);
        try {
            // Get the current user's Supabase UUID
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user?.id) {
                console.error("No user session found");
                setLoading(false);
                return;
            }

            const userId = session.user.id;
            const authUrl = `${API_BASE_URL}/auth/${provider}/start?user_id=${userId}`;

            // Open OAuth in a popup window
            const width = 600;
            const height = 700;
            const left = window.screenX + (window.outerWidth - width) / 2;
            const top = window.screenY + (window.outerHeight - height) / 2;

            const popup = window.open(
                authUrl,
                `${provider}_oauth`,
                `width=${width},height=${height},left=${left},top=${top}`
            );

            // Poll for popup close (OAuth callback will close it)
            const pollTimer = setInterval(() => {
                if (popup?.closed) {
                    clearInterval(pollTimer);
                    setConnected(true);
                    setLoading(false);
                }
            }, 500);

            // Timeout after 5 minutes
            setTimeout(() => {
                clearInterval(pollTimer);
                if (!popup?.closed) {
                    popup?.close();
                }
                setLoading(false);
            }, 5 * 60 * 1000);

        } catch (error) {
            console.error("OAuth connect failed:", error);
            setLoading(false);
        }
    };

    if (connected) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400">
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
            className={`
        flex items-center gap-2 px-3 py-2 rounded-lg
        bg-white/5 border border-glass-border
        text-foreground/70 hover:text-foreground
        hover:bg-white/10 hover:border-cyan/30
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-wait
      `}
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
