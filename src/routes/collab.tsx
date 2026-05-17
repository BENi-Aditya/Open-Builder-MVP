import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { CollabCard, type CollabPost } from "@/components/CollabCard";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

export const Route = createFileRoute("/collab")({ component: CollabPage });

function CollabPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CollabPost[]>([]);
  const [open, setOpen] = useState(false);
  const [applyTo, setApplyTo] = useState<CollabPost | null>(null);
  const [msg, setMsg] = useState("");

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [role, setRole] = useState("");
  const [tags, setTags] = useState("");

  const load = async () => {
    const { data } = await supabase.from("collab_posts").select("id, title, description, role_needed, tech_tags, is_open, created_at, user:profiles!collab_posts_user_id_fkey(id, username, display_name, avatar_url), project:projects(id, title)").order("created_at", { ascending: false });
    setPosts((data ?? []) as unknown as CollabPost[]);
  };
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("collab_posts").insert({
      user_id: user.id, title, description: desc, role_needed: role || null,
      tech_tags: tags.split(",").map((s) => s.trim()).filter(Boolean),
    });
    if (error) return toast.error(error.message);
    setOpen(false); setTitle(""); setDesc(""); setRole(""); setTags("");
    toast.success("Collab posted");
    load();
  };

  const apply = async () => {
    if (!user || !applyTo) return;
    const { error } = await supabase.from("collab_requests").insert({ post_id: applyTo.id, sender_id: user.id, message: msg });
    if (error) return toast.error(error.message);
    toast.success("Request sent");
    setApplyTo(null); setMsg("");
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 pb-24">
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <span className="pill text-[var(--grape)]">// collab board</span>
          <h1 className="font-display font-black text-4xl mt-2">Find your people.</h1>
          <p className="text-muted-foreground mt-1">Looking for cofounders, designers, engineers, hackathon teammates.</p>
        </div>
        {user && <button onClick={() => setOpen(true)} className="brutal-btn"><Plus className="w-4 h-4" /> Post a collab</button>}
        {!user && <Link to="/auth" className="brutal-btn">Sign in to post</Link>}
      </div>

      {posts.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No collab posts yet. Be first.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {posts.map((p) => <CollabCard key={p.id} post={p} onApply={user && p.user.id !== user.id ? () => setApplyTo(p) : undefined} />)}
        </div>
      )}

      {open && (
        <Modal onClose={() => setOpen(false)} title="Post a collab">
          <form onSubmit={create} className="space-y-3">
            <input required placeholder="Title (e.g. Looking for ML engineer)" value={title} onChange={(e) => setTitle(e.target.value)} className="brutal-input" />
            <textarea required placeholder="What are you building? What kind of teammate?" value={desc} onChange={(e) => setDesc(e.target.value)} className="brutal-input min-h-[120px]" />
            <input placeholder="Role needed (designer, dev, founder…)" value={role} onChange={(e) => setRole(e.target.value)} className="brutal-input" />
            <input placeholder="Tech tags (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)} className="brutal-input" />
            <button className="brutal-btn w-full justify-center">Post collab</button>
          </form>
        </Modal>
      )}

      {applyTo && (
        <Modal onClose={() => setApplyTo(null)} title={`Apply to: ${applyTo.title}`}>
          <textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Why are you a good fit?" className="brutal-input min-h-[120px] mb-3" />
          <button onClick={apply} className="brutal-btn w-full justify-center">Send request</button>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, title, onClose }: { children: React.ReactNode; title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 grid place-items-center p-4" onClick={onClose}>
      <div className="brutal-card p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-xl">{title}</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
