import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { uploadMedia } from "@/lib/upload";
import { toast } from "sonner";
import { Avatar } from "@/components/AppShell";
import { Image as ImageIcon, Zap, Send, Link2 } from "lucide-react";

export function Composer({ onPosted }: { onPosted?: () => void }) {
  const { user, profile } = useAuth();
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [projectId, setProjectId] = useState("");
  const [projects, setProjects] = useState<Array<{ id: string; title: string }>>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("projects")
      .select("id, title")
      .eq("owner_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50)
      .then(({ data }) => setProjects((data ?? []) as Array<{ id: string; title: string }>));
  }, [user?.id]);

  const submit = async () => {
    if (!user || !body.trim()) return;
    setSubmitting(true);
    try {
      let image_url: string | null = null;
      if (file) image_url = await uploadMedia(file, user.id, "logs");
      const { error } = await supabase.from("build_logs").insert({
        user_id: user.id,
        project_id: projectId || null,
        body: body.trim(),
        image_url,
      });
      if (error) throw error;
      setBody(""); setFile(null); setProjectId("");
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
        <div className="mb-2 rounded-none border-2 border-white/10 bg-black/20 p-2">
          <label className="mb-1 block text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Link this log to a project (optional)</label>
          <div className="relative">
            <Link2 className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="brutal-input pl-8 text-sm">
              <option value="">Standalone log (not linked)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={projectId ? "Share progress on this project..." : "What are you building right now?"}
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
