import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { ProjectCard, type FeedProject } from "@/components/ProjectCard";
import { BuildLogCard, type BuildLog } from "@/components/BuildLogCard";
import { CollabCard, type CollabPost } from "@/components/CollabCard";
import { Composer } from "@/components/Composer";
import { toast } from "sonner";
import { Flame, Sparkles, Users, X, Rocket } from "lucide-react";

export const Route = createFileRoute("/")({ component: FeedPage });

type FeedItem =
  | { kind: "project"; created_at: string; data: FeedProject }
  | { kind: "log"; created_at: string; data: BuildLog }
  | { kind: "collab"; created_at: string; data: CollabPost };

function FeedPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [tab, setTab] = useState<"all" | "following" | "trending">("all");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ builders: 0, projects: 0 });
  const [myCollabRequests, setMyCollabRequests] = useState<string[]>([]);
  const [applyTo, setApplyTo] = useState<CollabPost | null>(null);
  const [applyMessage, setApplyMessage] = useState("");

  const load = async () => {
    setLoading(true);

    const [{ count: bc }, { count: pc }] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("projects").select("id", { count: "exact", head: true }),
    ]);
    setStats({ builders: bc ?? 0, projects: pc ?? 0 });

    let followingIds: string[] | null = null;
    if (tab === "following" && user) {
      const { data } = await supabase.from("follows").select("following_id").eq("follower_id", user.id);
      followingIds = (data ?? []).map((r) => r.following_id);
      if (followingIds.length === 0) { setItems([]); setLoading(false); return; }
    }

    const projQ = supabase.from("projects").select("id, title, slug, tagline, cover_url, category, tech_stack, like_count, comment_count, github_url, demo_url, created_at, owner:profiles!projects_owner_id_fkey(id, username, display_name, avatar_url)").eq("visibility", "public").limit(20);
    if (followingIds) projQ.in("owner_id", followingIds);
    projQ.order(tab === "trending" ? "like_count" : "created_at", { ascending: false });

    const logQ = supabase.from("build_logs").select("id, body, image_url, created_at, project_id, project:projects(id, title), user:profiles!build_logs_user_id_fkey(id, username, display_name, avatar_url)").order("created_at", { ascending: false }).limit(15);
    if (followingIds) logQ.in("user_id", followingIds);

    const collabQ = supabase.from("collab_posts").select("id, title, description, role_needed, tech_tags, is_open, created_at, user:profiles!collab_posts_user_id_fkey(id, username, display_name, avatar_url), project:projects(id, title)").eq("is_open", true).order("created_at", { ascending: false }).limit(8);
    if (followingIds) collabQ.in("user_id", followingIds);

    const [p, l, c] = await Promise.all([projQ, logQ, collabQ]);

    const projectIds = ((p.data ?? []) as FeedProject[]).map((d) => d.id);
    let recentCommentsByProject: Record<string, any[]> = {};

    if (projectIds.length > 0) {
      const { data: commentsData } = await supabase
        .from("comments")
        .select("id, body, created_at, project_id, user:profiles!comments_user_id_fkey(id, username, display_name, avatar_url)")
        .in("project_id", projectIds)
        .order("created_at", { ascending: false });

      for (const comment of commentsData ?? []) {
        const key = comment.project_id;
        if (!recentCommentsByProject[key]) recentCommentsByProject[key] = [];
        if (recentCommentsByProject[key].length < 2) recentCommentsByProject[key].push(comment);
      }
    }

    const projects = ((p.data ?? []) as FeedProject[]).map((d) => ({
      ...d,
      recent_comments: recentCommentsByProject[d.id] ?? [],
    }));

    if (user) {
      const { data: reqs } = await supabase.from("collab_requests").select("post_id").eq("sender_id", user.id);
      setMyCollabRequests((reqs ?? []).map((r) => r.post_id));
    } else {
      setMyCollabRequests([]);
    }

    const merged: FeedItem[] = [
      ...projects.map((d) => ({ kind: "project" as const, created_at: d.created_at, data: d })),
      ...((l.data ?? []) as unknown as BuildLog[]).map((d) => ({ kind: "log" as const, created_at: d.created_at, data: d })),
      ...((c.data ?? []) as unknown as CollabPost[]).map((d) => ({ kind: "collab" as const, created_at: d.created_at, data: d })),
    ];
    if (tab !== "trending") merged.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    setItems(merged);
    setLoading(false);
  };

  useEffect(() => { load(); }, [tab, user?.id]);

  const applyToCollab = async () => {
    if (!user || !applyTo) return;
    if (myCollabRequests.includes(applyTo.id)) {
      toast.error("You already applied to this collab");
      setApplyTo(null);
      setApplyMessage("");
      return;
    }

    const { error } = await supabase.from("collab_requests").insert({
      post_id: applyTo.id,
      sender_id: user.id,
      message: applyMessage.trim() || "Hi! I’d love to join this.",
    });

    if (error) {
      toast.error(error.message || "Could not send collab request");
      setApplyTo(null);
      setApplyMessage("");
      return;
    }

    toast.success("Request sent");
    setMyCollabRequests((prev) => [...prev, applyTo.id]);
    setApplyTo(null);
    setApplyMessage("");
  };

  return (
    <div className="feed-shell">
      <header className="brutal-card-flat p-6 md:p-10 mb-8 relative overflow-hidden scan-noise">
        <div className="grid-bg absolute inset-0 opacity-50" />
        <div className="relative">
          <span className="pill text-primary mb-3 inline-flex">// live builder ecosystem</span>
          <h1 className="font-display font-black text-4xl md:text-6xl leading-[0.95]">
            Build publicly.<br/>
            <span className="text-primary">Find your people.</span><br/>
            Ship insane things.
          </h1>
          <div className="flex flex-wrap gap-4 mt-6 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            <span><b className="text-foreground">{stats.builders.toLocaleString()}</b> builders</span>
            <span><b className="text-foreground">{stats.projects.toLocaleString()}</b> projects shipped</span>
            <span className="text-[var(--tangerine)]"><span className="cursor-blink">●</span> activity now</span>
          </div>
          {!user && (
            <div className="flex gap-2 mt-6">
              <Link to="/auth" className="brutal-btn">Join the builders</Link>
              <Link to="/explore" className="brutal-btn brutal-btn-ghost">Explore →</Link>
            </div>
          )}
        </div>
      </header>

      {user && (
        <section className="mb-4 space-y-3">
          <div className="brutal-card-flat border-primary/40 bg-[color:color-mix(in_oklab,var(--primary)_7%,var(--card))] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">Post options</p>
                <h2 className="font-display text-xl font-black leading-tight">Quick build update or full project launch?</h2>
                <p className="mt-1 text-sm text-muted-foreground">Use log for small progress. Use project launch for something people can save, like, and explore.</p>
              </div>
              <Link to="/new" className="brutal-btn justify-center sm:shrink-0">
                <Rocket className="h-4 w-4" /> Ship full project
              </Link>
            </div>
          </div>
          <Composer onPosted={load} />
        </section>
      )}

      <div className="sticky top-0 z-30 -mx-4 bg-background/95 px-4 pt-2 backdrop-blur-sm md:-mx-0 md:px-0">
        <div className="flex gap-1 mt-4 mb-4 border-b-2 border-white/10 overflow-x-auto">
          {[
            { id: "all", label: "All", icon: Sparkles },
            { id: "trending", label: "Trending", icon: Flame },
            { id: "following", label: "Following", icon: Users },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)} className={`feed-tab flex items-center gap-2 px-4 py-2 font-bold uppercase text-xs tracking-wider border-b-4 ${tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="feed-stack">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="brutal-card-flat h-72 animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="brutal-card-flat p-10 text-center">
          <p className="text-muted-foreground">No activity yet. {tab === "following" && "Follow some builders to see their work here."}</p>
        </div>
      ) : (
        <div className="feed-stack">
          {items.map((it, i) => (
            <div key={`${it.kind}-${"id" in it.data ? it.data.id : i}`}>
              {it.kind === "project" && <ProjectCard project={it.data} accentSeed={i} size="md" />}
              {it.kind === "log" && <BuildLogCard log={it.data} />}
              {it.kind === "collab" && (
                <CollabCard
                  post={it.data}
                  onApply={user && it.data.user.id !== user.id && !myCollabRequests.includes(it.data.id) ? () => setApplyTo(it.data) : undefined}
                  isApplied={!!(user && myCollabRequests.includes(it.data.id))}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {applyTo && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setApplyTo(null)}>
          <div className="brutal-card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-bold">Apply to: {applyTo.title}</h2>
              <button onClick={() => setApplyTo(null)} className="rounded-none border-2 border-white/20 p-2 hover:border-white/40">
                <X className="h-4 w-4" />
              </button>
            </div>
            <textarea
              value={applyMessage}
              onChange={(e) => setApplyMessage(e.target.value)}
              placeholder="Why are you a good fit?"
              className="brutal-input min-h-[120px] mb-3"
            />
            <button onClick={applyToCollab} className="brutal-btn w-full justify-center">Send request</button>
          </div>
        </div>
      )}
    </div>
  );
}
