import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { uploadMedia } from "@/lib/upload";
import { toast } from "sonner";
import { Avatar } from "@/components/AppShell";
import { Image as ImageIcon, Zap, Send } from "lucide-react";

export function Composer({ onPosted }: { onPosted?: () => void }) {
  const { user, profile } = useAuth();
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!user || !body.trim()) return;
    setSubmitting(true);
    try {
      let image_url: string | null = null;
      if (file) image_url = await uploadMedia(file, user.id, "logs");
      const { error } = await supabase.from("build_logs").insert({ user_id: user.id, body: body.trim(), image_url });
      if (error) throw error;
      setBody(""); setFile(null);
      toast.success("Build log shipped");
      onPosted?.();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || !profile) return null;
  return (
    <div className="brutal-card-flat p-4 flex gap-3">
      <Avatar profile={profile} size={36} />
      <div className="flex-1">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What are you building right now?"
          className="brutal-input min-h-[70px] resize-y"
          maxLength={1000}
        />
        {file && <div className="text-xs font-mono mt-2 text-[var(--tangerine)]">📎 {file.name}</div>}
        <div className="flex items-center justify-between mt-2">
          <label className="brutal-btn brutal-btn-ghost text-[10px] py-1.5 cursor-pointer">
            <ImageIcon className="w-3 h-3" /> Image
            <input type="file" accept="image/*" hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <button onClick={submit} disabled={submitting || !body.trim()} className="brutal-btn text-[10px] py-1.5 disabled:opacity-50">
            <Zap className="w-3 h-3" /> {submitting ? "Shipping…" : "Post log"} <Send className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
