import { Link } from "@tanstack/react-router";
import { Avatar } from "@/components/AppShell";
import { formatDistanceToNow } from "date-fns";
import { Zap } from "lucide-react";

export type BuildLog = {
  id: string;
  body: string;
  image_url: string | null;
  created_at: string;
  project_id: string | null;
  project?: { id: string; title: string } | null;
  user: { id: string; username: string; display_name: string | null; avatar_url: string | null };
};

export function BuildLogCard({ log }: { log: BuildLog }) {
  return (
    <article className="brutal-card-flat p-4 flex gap-3">
      <Avatar profile={log.user} size={36} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <Link to="/u/$username" params={{ username: log.user.username }} className="font-bold text-sm hover:text-primary">
            {log.user.display_name || log.user.username}
          </Link>
          <span className="text-xs font-mono text-muted-foreground">@{log.user.username}</span>
          <span className="text-[10px] font-mono uppercase text-muted-foreground">
            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-1 text-[10px] font-mono uppercase text-[var(--tangerine)]">
          <Zap className="w-3 h-3" /> build log
          {log.project && (
            <>
              <span className="text-muted-foreground">·</span>
              <Link to="/p/$id" params={{ id: log.project.id }} className="hover:text-primary">{log.project.title}</Link>
            </>
          )}
        </div>
        <p className="mt-2 text-sm whitespace-pre-wrap">{log.body}</p>
        {log.image_url && (
          <img src={log.image_url} alt="" className="mt-3 border-2 border-white/20 max-h-96 object-cover" />
        )}
      </div>
    </article>
  );
}
