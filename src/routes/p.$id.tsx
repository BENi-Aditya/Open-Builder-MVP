import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Avatar } from "@/components/AppShell";
import { Heart, MessageCircle, Bookmark, Github, ExternalLink, Trash2, Send, Zap, Youtube } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { uploadMedia } from "@/lib/upload";
import { createNotification } from "@/lib/notifications";

export const Route = createFileRoute("/p/$id")({ component: ProjectPage });

function ProjectPage() {
  const { id } = Route.useParams();
  const { user, profile: me } = useAuth();
  const [project, setProject] = useState<any | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [comment, setComment] = useState("");
  const [logBody, setLogBody] = useState("");
  const [logFile, setLogFile] = useState<File | null>(null);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [commentLikes, setCommentLikes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("projects").select("*, owner:profiles!projects_owner_id_fkey(id, username, display_name, avatar_url, bio)").eq("id", id).maybeSingle();
    setProject(data);
    const [{ data: cm }, { data: lg }] = await Promise.all([
      supabase.from("comments").select("id, body, created_at, user_id, like_count, user:profiles!comments_user_id_fkey(id, username, display_name, avatar_url)").eq("project_id", id).order("created_at", { ascending: false }),
      supabase.from("build_logs").select("id, body, image_url, created_at, like_count, comment_count, user:profiles!build_logs_user_id_fkey(id, username, display_name, avatar_url)").eq("project_id", id).order("created_at", { ascending: false }),
    ]);
    setComments(cm ?? []);
    setLogs(lg ?? []);
    if (user) {
      const [{ data: lk }, { data: sv }, { data: clk }] = await Promise.all([
        supabase.from("likes").select("user_id").eq("user_id", user.id).eq("project_id", id).maybeSingle(),
        supabase.from("saves").select("user_id").eq("user_id", user.id).eq("project_id", id).maybeSingle(),
        supabase.from("comment_likes").select("comment_id").eq("user_id", user.id),
      ]);
      setLiked(!!lk); setSaved(!!sv); setCommentLikes(clk?.map(l => l.comment_id) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id, user?.id]);

  if (loading) return <div className="p-10 text-center text-muted-foreground font-mono">loading...</div>;
  if (!project) return <div className="p-10 text-center"><h1 className="font-display text-3xl">Project not found</h1></div>;

  const toggleLike = async () => {
    if (!user) return toast.error("Sign in first");
    if (liked) { await supabase.from("likes").delete().eq("user_id", user.id).eq("project_id", id); setLiked(false); setProject((p: any) => ({ ...p, like_count: Math.max(0, p.like_count - 1) })); }
    else {
      await supabase.from("likes").insert({ user_id: user.id, project_id: id });
      setLiked(true); setProject((p: any) => ({ ...p, like_count: p.like_count + 1 }));
      await createNotification({
        userId: project.owner_id,
        actorId: user.id,
        type: "like",
        entityId: id,
        entityType: "project",
        body: `${user.user_metadata?.username || "Someone"} liked your project`,
      });
    }
  };
  const toggleSave = async () => {
    if (!user) return toast.error("Sign in first");
    if (saved) { await supabase.from("saves").delete().eq("user_id", user.id).eq("project_id", id); setSaved(false); }
    else { await supabase.from("saves").insert({ user_id: user.id, project_id: id }); setSaved(true); }
  };
  const toggleCommentLike = async (cid: string) => {
    if (!user) return toast.error("Sign in first");
    const isLiked = commentLikes.includes(cid);
    if (isLiked) {
      await supabase.from("comment_likes").delete().eq("user_id", user.id).eq("comment_id", cid);
      setCommentLikes(prev => prev.filter(id => id !== cid));
      setComments(prev => prev.map(c => c.id === cid ? { ...c, like_count: Math.max(0, c.like_count - 1) } : c));
    } else {
      await supabase.from("comment_likes").insert({ user_id: user.id, comment_id: cid });
      setCommentLikes(prev => [...prev, cid]);
      setComments(prev => prev.map(c => c.id === cid ? { ...c, like_count: c.like_count + 1 } : c));
    }
  };
  const addComment = async () => {
    if (!user || !comment.trim()) return;
    const { error } = await supabase.from("comments").insert({ project_id: id, user_id: user.id, body: comment.trim() });
    if (error) return toast.error(error.message);
    await createNotification({
      userId: project.owner_id,
      actorId: user.id,
      type: "comment",
      entityId: id,
      entityType: "project",
      body: `${user.user_metadata?.username || "Someone"} commented on your project`,
    });
    setComment(""); load();
  };
  const addLog = async () => {
    if (!user || !logBody.trim()) return;
    let image_url: string | null = null;
    if (logFile) image_url = await uploadMedia(logFile, user.id, "logs");
    const { error } = await supabase.from("build_logs").insert({ project_id: id, user_id: user.id, body: logBody.trim(), image_url });
    if (error) return toast.error(error.message);
    setLogBody(""); setLogFile(null); load();
  };
  const deleteComment = async (cid: string) => {
    await supabase.from("comments").delete().eq("id", cid); load();
  };

  const isOwner = user?.id === project.owner_id;

  return (
    <div className="pb-24">
      {/* Hero */}
      <div className="relative h-48 md:h-72 bg-ink border-b-2 border-white/10 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30" />
        {project.cover_url ? (
          <>
            <img 
              src={project.cover_url} 
              alt="" 
              className="w-full h-full object-cover opacity-60 grayscale-[20%]" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
        )}
        <div className="absolute inset-0 scan-noise opacity-15" />
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 -mt-16 relative z-10">
        <div className="brutal-card bg-card p-6 md:p-8">
          <div className="flex flex-wrap gap-2 mb-3">
            {project.category && <span className="pill bg-primary text-primary-foreground border-primary">{project.category}</span>}
            {project.tech_stack?.map((t: string) => <span key={t} className="pill text-muted-foreground">{t}</span>)}
          </div>
          <h1 className="font-display font-black text-4xl md:text-6xl leading-none">{project.title}</h1>
          {project.tagline && <p className="mt-3 text-xl text-muted-foreground">{project.tagline}</p>}

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <Link to="/u/$username" params={{ username: project.owner.username }} className="flex items-center gap-2">
              <Avatar profile={project.owner} size={40} />
              <div>
                <div className="font-bold text-sm">{project.owner.display_name || project.owner.username}</div>
                <div className="text-xs font-mono text-muted-foreground">@{project.owner.username}</div>
              </div>
            </Link>
            <div className="flex-1" />
            <button onClick={toggleLike} className={`brutal-btn ${liked ? "" : "brutal-btn-ghost"} text-xs`}>
              <Heart className="w-4 h-4" fill={liked ? "currentColor" : "none"} /> {project.like_count}
            </button>
            <button onClick={toggleSave} className={`brutal-btn ${saved ? "" : "brutal-btn-ghost"} text-xs`}>
              <Bookmark className="w-4 h-4" fill={saved ? "currentColor" : "none"} />
            </button>
            {project.demo_url && <a href={project.demo_url} target="_blank" rel="noreferrer" className="brutal-btn text-xs"><ExternalLink className="w-4 h-4" /> Live</a>}
            {project.youtube_url && <a href={project.youtube_url} target="_blank" rel="noreferrer" className="brutal-btn brutal-btn-ghost text-xs"><Youtube className="w-4 h-4" /> Video</a>}
            {project.github_url && <a href={project.github_url} target="_blank" rel="noreferrer" className="brutal-btn brutal-btn-ghost text-xs"><Github className="w-4 h-4" /> Code</a>}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 space-y-6">
            {project.description && (
              <section className="brutal-card-flat p-6">
                <h2 className="font-display font-bold text-xl mb-3">README</h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{project.description}</p>
              </section>
            )}

            <section className="brutal-card-flat p-6">
              <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-[var(--tangerine)]" /> Build timeline</h2>
              {isOwner && (
                <div className="mb-4 p-3 border-2 border-white/20">
                  <textarea value={logBody} onChange={(e) => setLogBody(e.target.value)} placeholder="What did you ship today?" className="brutal-input min-h-[60px]" />
                  <div className="flex items-center justify-between mt-2">
                    <label className="text-xs font-mono cursor-pointer text-muted-foreground hover:text-primary">
                      {logFile ? `📎 ${logFile.name}` : "+ image"}
                      <input type="file" accept="image/*" hidden onChange={(e) => setLogFile(e.target.files?.[0] ?? null)} />
                    </label>
                    <button onClick={addLog} className="brutal-btn text-[10px] py-1.5">Post update</button>
                  </div>
                </div>
              )}
              {logs.length === 0 ? <p className="text-muted-foreground text-sm">No build logs yet.</p> : (
                <ol className="space-y-3 relative">
                  {logs.map((l) => (
                    <li key={l.id} className="border-l-4 border-[var(--tangerine)] pl-4 py-1">
                      <div className="text-[10px] font-mono uppercase text-muted-foreground">{formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}</div>
                      <p className="text-sm whitespace-pre-wrap mt-1">{l.body}</p>
                      {l.image_url && <img src={l.image_url} alt="" className="mt-2 w-full max-w-full border-2 border-white/20 object-cover max-h-72" />}
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section className="brutal-card-flat p-6">
              <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2"><MessageCircle className="w-5 h-5" /> Comments ({comments.length})</h2>
              {user ? (
                <div className="flex gap-2 mb-4">
                  <Avatar profile={me} size={32} />
                  <div className="flex-1 flex gap-2">
                    <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Drop a comment…" className="brutal-input" onKeyDown={(e) => e.key === "Enter" && addComment()} />
                    <button onClick={addComment} className="brutal-btn"><Send className="w-4 h-4" /></button>
                  </div>
                </div>
              ) : <Link to="/auth" className="text-sm text-primary mb-4 block">Sign in to comment →</Link>}
              <div className="space-y-3">
                {comments.map((c) => {
                  const isLiked = commentLikes.includes(c.id);
                  return (
                    <div key={c.id} className="flex gap-3 group">
                      <Avatar profile={c.user} size={32} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <Link to="/u/$username" params={{ username: c.user.username }} className="font-bold text-sm">{c.user.display_name || c.user.username}</Link>
                          <span className="text-[10px] font-mono text-muted-foreground">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                          <div className="ml-auto flex items-center gap-2">
                            <button 
                              onClick={() => toggleCommentLike(c.id)} 
                              className={`flex items-center gap-1 text-[10px] font-bold uppercase transition-colors ${isLiked ? 'text-pink-500' : 'text-muted-foreground hover:text-pink-500'}`}
                            >
                              <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
                              {c.like_count > 0 && c.like_count}
                            </button>
                            {(user?.id === c.user_id || isOwner) && (
                              <button onClick={() => deleteComment(c.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"><Trash2 className="w-3 h-3" /></button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm mt-0.5">{c.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <div className="brutal-card-flat p-4">
              <h3 className="font-display font-bold mb-3">Stats</h3>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between"><span className="text-muted-foreground">Likes</span><b>{project.like_count}</b></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Comments</span><b>{project.comment_count}</b></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Logs</span><b>{logs.length}</b></div>
              </div>
            </div>
            {project.owner.bio && (
              <div className="brutal-card-flat p-4">
                <h3 className="font-display font-bold mb-2">About the builder</h3>
                <p className="text-sm text-muted-foreground">{project.owner.bio}</p>
              </div>
            )}
            {isOwner && (
              <button
                onClick={async () => { if (!confirm("Delete this project?")) return; await supabase.from("projects").delete().eq("id", id); toast.success("Deleted"); history.back(); }}
                className="brutal-btn brutal-btn-danger w-full justify-center text-xs"
              ><Trash2 className="w-3 h-3" /> Delete project</button>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
