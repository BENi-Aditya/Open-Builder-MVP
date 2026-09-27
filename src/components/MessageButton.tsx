import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { friendlyError } from "@/lib/huddle";

/**
 * Opens (or creates) the 1:1 DM with `targetId` using the existing chats /
 * chat_participants / messages architecture, then jumps to the Messages page.
 */
export function MessageButton({ targetId, size = "md", className = "" }: { targetId: string; size?: "sm" | "md"; className?: string }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);

  if (!user || user.id === targetId) return null;

  const open = async () => {
    setBusy(true);
    const { data, error } = await supabase.rpc("get_or_create_direct_chat", { other_user_id: targetId });
    setBusy(false);
    if (error || !data) return toast.error(friendlyError(error?.message, "Couldn't open chat"));
    nav({ to: "/chat", search: { id: data } });
  };

  const sz = size === "sm" ? "text-[10px] py-1 px-2" : "text-xs";
  return (
    <button onClick={open} disabled={busy} className={`brutal-btn brutal-btn-ghost ${sz} ${className}`}>
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />} Message
    </button>
  );
}
