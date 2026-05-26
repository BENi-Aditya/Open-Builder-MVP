import { Link } from "@tanstack/react-router";
import { Heart, MessageCircle, Bookmark, ExternalLink, Github } from "lucide-react";
import { Avatar } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { formatDistanceToNow } from "date-fns";

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

  const heights = { sm: "h-32", md: "h-44", lg: "h-64" };

  return (
    <article className="brutal-card overflow-hidden flex flex-col group">
      <Link to="/p/$id" params={{ id: project.id }} className="block relative overflow-hidden">
        <div className={`${heights[size]} relative bg-ink overflow-hidden border-b border-white/10`}>
          <div className="absolute inset-0 grid-bg opacity-20" />
          {project.cover_url ? (
            <img 
              src={project.cover_url} 
              alt={project.title} 
              className="w-full h-full object-cover opacity-70 grayscale-[20%] group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-300" 
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-primary/5 to-transparent">
              <span className="font-display font-black text-5xl text-white/10 select-none">{project.title[0]?.toUpperCase()}</span>
            </div>
          )}
          <div className="absolute inset-0 scan-noise opacity-10" />
          {project.category && (
            <span className="absolute top-2 left-2 pill bg-black text-white border-white z-10">{project.category}</span>
          )}
        </div>
      </Link>
      <div className="p-4 flex-1 flex flex-col gap-2">
        <Link to="/p/$id" params={{ id: project.id }}>
          <h3 className="font-display font-bold text-lg leading-tight hover:text-primary">{project.title}</h3>
        </Link>
        {project.tagline && <p className="text-sm text-muted-foreground line-clamp-2">{project.tagline}</p>}
        {project.tech_stack && project.tech_stack.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {project.tech_stack.slice(0, 4).map((t) => (
              <span key={t} className="pill text-muted-foreground">{t}</span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between mt-auto pt-3 border-t-2 border-white/10">
          <Link to="/u/$username" params={{ username: project.owner.username }} className="flex items-center gap-2 min-w-0">
            <Avatar profile={project.owner} size={24} />
            <span className="text-xs font-mono truncate">@{project.owner.username}</span>
          </Link>
          <div className="flex items-center gap-1">
            <button onClick={toggleLike} className={`flex items-center gap-1 px-2 py-1 border-2 ${liked ? "border-[var(--citrus)] text-[var(--citrus)]" : "border-transparent hover:border-white/30"}`}>
              <Heart className="w-3.5 h-3.5" fill={liked ? "currentColor" : "none"} />
              <span className="text-xs font-bold">{likes}</span>
            </button>
            <Link to="/p/$id" params={{ id: project.id }} className="flex items-center gap-1 px-2 py-1 hover:border-2 hover:border-white/30">
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">{project.comment_count}</span>
            </Link>
            <button onClick={toggleSave} className={`px-2 py-1 border-2 ${saved ? "border-primary text-primary" : "border-transparent hover:border-white/30"}`}>
              <Bookmark className="w-3.5 h-3.5" fill={saved ? "currentColor" : "none"} />
            </button>
            {project.demo_url && <a href={project.demo_url} target="_blank" rel="noreferrer" className="px-2 py-1 hover:border-2 hover:border-white/30"><ExternalLink className="w-3.5 h-3.5" /></a>}
            {project.github_url && <a href={project.github_url} target="_blank" rel="noreferrer" className="px-2 py-1 hover:border-2 hover:border-white/30"><Github className="w-3.5 h-3.5" /></a>}
          </div>
        </div>
        <div className="text-[10px] font-mono uppercase text-muted-foreground">
          shipped {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
        </div>
      </div>
    </article>
  );
}
