import { Link } from "@tanstack/react-router";
import { Avatar } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { formatDistanceToNow } from "date-fns";
import { Users, ArrowRight } from "lucide-react";

export type CollabPost = {
  id: string;
  title: string;
  description: string;
  role_needed: string | null;
  tech_tags: string[] | null;
  is_open: boolean;
  created_at: string;
  user: { id: string; username: string; display_name: string | null; avatar_url: string | null };
  project?: { id: string; title: string } | null;
};

export function CollabCard({ post, onApply, isApplied }: { post: CollabPost; onApply?: () => void; isApplied?: boolean }) {
  const { user } = useAuth();
  const canApply = post.is_open && !isApplied;

  return (
    <article className="brutal-card p-5 flex flex-col gap-3" style={{ background: "linear-gradient(135deg, var(--card) 0%, color-mix(in oklab, var(--grape) 10%, var(--card)) 100%)" }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="pill bg-[var(--grape)] text-white border-white"><Users className="w-3 h-3 mr-1" /> collab</span>
          {post.role_needed && <span className="pill text-[var(--tangerine)]">{post.role_needed}</span>}
          {!post.is_open && <span className="pill text-muted-foreground">closed</span>}
          {isApplied && <span className="pill bg-green-500/20 text-green-500 border-green-500/50">Applied</span>}
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
      </div>
      <h3 className="font-display font-bold text-xl leading-tight">{post.title}</h3>
      <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">{post.description}</p>
      {post.tech_tags && post.tech_tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {post.tech_tags.map((t) => <span key={t} className="pill text-muted-foreground">{t}</span>)}
        </div>
      )}
      <div className="flex items-center justify-between mt-2 pt-3 border-t-2 border-white/10">
        <Link to="/u/$username" params={{ username: post.user.username }} className="flex items-center gap-2">
          <Avatar profile={post.user} size={28} />
          <div>
            <div className="text-xs font-bold leading-none">{post.user.display_name || post.user.username}</div>
            <div className="text-[10px] font-mono text-muted-foreground">@{post.user.username}</div>
          </div>
        </Link>

        {canApply && (
          user ? (
            <button onClick={onApply} className="brutal-btn text-[10px] py-1.5">
              Apply <ArrowRight className="w-3 h-3" />
            </button>
          ) : (
            <Link to="/auth" className="brutal-btn brutal-btn-ghost text-[10px] py-1.5">
              Log in to apply
            </Link>
          )
        )}
      </div>
    </article>
  );
}
