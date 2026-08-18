import { Link } from "@tanstack/react-router";
import { Heart, MessageCircle, Bookmark, ExternalLink, Github } from "lucide-react";
import { Avatar } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { createNotification } from "@/lib/notifications";
import { formatDistanceToNow } from "date-fns";

export type ProjectCommentPreview = {
  id: string;
  body: string;
  created_at: string;
  user: { id: string; username: string; display_name: string | null; avatar_url: string | null };
};

export type FeedProject = {
  id: string;
  title: string;
  slug: string;
  tagline: string | null;
  cover_url: string | null;
  category: string | null;
  tech_stack: string[] | null;
  like_count: number;
  comment_count: number;
  github_url: string | null;
  demo_url: string | null;
  created_at: string;
  owner: { id: string; username: string; display_name: string | null; avatar_url: string | null };
  recent_comments?: ProjectCommentPreview[];
};

const COLOR_BY_INDEX = ["var(--grape)", "var(--tangerine)", "var(--sky)", "var(--primary)", "var(--citrus)"];

export function ProjectCard({ project, accentSeed = 0, size = "md" }: { project: FeedProject; accentSeed?: number; size?: "sm" | "md" | "lg" }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likes, setLikes] = useState(project.like_count);
  const accent = COLOR_BY_INDEX[accentSeed % COLOR_BY_INDEX.length];

  useEffect(() => {
    if (!user) return;
    supabase.from("likes").select("user_id").eq("user_id", user.id).eq("project_id", project.id).maybeSingle()
      .then(({ data }) => setLiked(!!data));
    supabase.from("saves").select("user_id").eq("user_id", user.id).eq("project_id", project.id).maybeSingle()
      .then(({ data }) => setSaved(!!data));
  }, [user, project.id]);

  const toggleLike = async () => {
    if (!user) return;
    if (liked) {
      await supabase.from("likes").delete().eq("user_id", user.id).eq("project_id", project.id);
      setLiked(false); setLikes((n) => Math.max(0, n - 1));
    } else {
      await supabase.from("likes").insert({ user_id: user.id, project_id: project.id });
      setLiked(true); setLikes((n) => n + 1);

      await createNotification({
        userId: project.owner.id,
        actorId: user.id,
        type: "like",
        entityId: project.id,
        entityType: "project",
        body: `${user.user_metadata?.username || "Someone"} liked your project`,
      });
    }
  };
  const toggleSave = async () => {
    if (!user) return;
    if (saved) {
      await supabase.from("saves").delete().eq("user_id", user.id).eq("project_id", project.id);
      setSaved(false);
    } else {
      await supabase.from("saves").insert({ user_id: user.id, project_id: project.id });
      setSaved(true);
    }
  };

  const heights = { sm: "h-40", md: "h-56", lg: "h-72" };

  return (
    <article className="feed-item-card brutal-card group flex w-full flex-col overflow-hidden bg-[color:var(--card)] transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-center justify-between gap-3 border-b-2 border-white/10 px-3 py-2.5">
        <Link to="/u/$username" params={{ username: project.owner.username }} className="flex min-w-0 items-center gap-2">
          <Avatar profile={project.owner} size={28} />
          <div className="min-w-0">
            <div className="truncate text-xs font-bold">{project.owner.display_name || project.owner.username}</div>
            <div className="truncate text-[10px] font-mono text-muted-foreground">@{project.owner.username}</div>
          </div>
        </Link>

        <button
          onClick={toggleSave}
          aria-label={saved ? "Remove save" : "Save project"}
          className={`shrink-0 border-2 p-1.5 transition-colors ${saved ? "border-primary bg-primary text-primary-foreground" : "border-transparent hover:border-white/30 hover:bg-white/5"}`}
        >
          <Bookmark className="h-3.5 w-3.5" fill={saved ? "currentColor" : "none"} />
        </button>
      </div>

      <Link to="/p/$id" params={{ id: project.id }} className="block relative overflow-hidden">
        <div className={`${heights[size]} relative bg-ink overflow-hidden`}>
          <div className="absolute inset-0 grid-bg opacity-20" />
          {project.cover_url ? (
            <img
              src={project.cover_url}
              alt={project.title}
              className="h-full w-full object-cover opacity-90 transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-primary/10 via-transparent to-[var(--grape)]/30">
              <span className="font-display font-black text-5xl text-white/10 select-none">{project.title[0]?.toUpperCase()}</span>
            </div>
          )}
          <div className="absolute inset-0 scan-noise opacity-10" />
          {project.category && (
            <span className="absolute left-3 top-3 pill bg-black text-white border-white z-10">{project.category}</span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <div className="flex items-center justify-between gap-3">
          <Link to="/p/$id" params={{ id: project.id }} className="min-w-0">
            <h3 className="font-display text-xl font-black leading-tight hover:text-primary">{project.title}</h3>
          </Link>
          <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
            {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
          </div>
        </div>

        {project.tagline && <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">{project.tagline}</p>}

        {project.tech_stack && project.tech_stack.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {project.tech_stack.slice(0, 3).map((t) => (
              <span key={t} className="pill text-muted-foreground">{t}</span>
            ))}
          </div>
        )}

        <div className="mt-1 flex items-center justify-between gap-2 border-t-2 border-white/10 pt-2.5">
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleLike}
              className={`flex items-center gap-1.5 border-2 px-2 py-1 text-xs font-bold transition-colors ${liked ? "border-[var(--citrus)] bg-[var(--citrus)]/10 text-[var(--citrus)]" : "border-transparent hover:border-white/30 hover:bg-white/5"}`}
            >
              <Heart className="h-3.5 w-3.5" fill={liked ? "currentColor" : "none"} />
              {likes}
            </button>

            <Link to="/p/$id" params={{ id: project.id }} className="flex items-center gap-1.5 border-2 border-transparent px-2 py-1 text-xs font-bold hover:border-white/30 hover:bg-white/5">
              <MessageCircle className="h-3.5 w-3.5" />
              {project.comment_count}
            </Link>
          </div>

          <div className="flex items-center gap-1 text-muted-foreground">
            {project.demo_url && (
              <a href={project.demo_url} target="_blank" rel="noreferrer" className="border-2 border-transparent p-1.5 hover:border-white/30 hover:bg-white/5" aria-label="Open demo">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            {project.github_url && (
              <a href={project.github_url} target="_blank" rel="noreferrer" className="border-2 border-transparent p-1.5 hover:border-white/30 hover:bg-white/5" aria-label="Open GitHub">
                <Github className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>

        {project.recent_comments && project.recent_comments.length > 0 && (
          <div className="mt-2 border-t-2 border-white/10 pt-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">Comments</span>
              <Link to="/p/$id" params={{ id: project.id }} className="text-[10px] font-mono uppercase tracking-[0.12em] text-primary hover:text-primary/80">
                View all
              </Link>
            </div>

            <div className="space-y-2">
              {project.recent_comments.slice(0, 2).map((comment) => (
                <div key={comment.id} className="flex items-start gap-2 rounded-none border border-white/10 bg-white/[0.02] p-2">
                  <Avatar profile={comment.user} size={22} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                      <span className="font-bold text-foreground">{comment.user.display_name || comment.user.username}</span>
                      <span>@{comment.user.username}</span>
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">{comment.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
