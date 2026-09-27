import { Link } from "@tanstack/react-router";
import { Avatar } from "@/components/AppShell";
import type { MiniProfile } from "@/lib/huddle";

export function AttendeeAvatars({
  attendees,
  total,
  max = 6,
  size = 28,
  linkable = true,
}: {
  attendees: MiniProfile[];
  total: number;
  max?: number;
  size?: number;
  linkable?: boolean;
}) {
  const shown = attendees.slice(0, max);
  const extra = Math.max(0, total - shown.length);
  if (total === 0) return null;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {shown.map((p) => {
          const node = (
            <div className="border-2 border-ink bg-ink" style={{ boxShadow: "2px 2px 0 0 #000" }}>
              <Avatar profile={p} size={size} />
            </div>
          );
          return linkable ? (
            <Link key={p.id} to="/u/$username" params={{ username: p.username }} title={p.display_name || p.username} className="transition-transform hover:-translate-y-0.5">
              {node}
            </Link>
          ) : (
            <div key={p.id} title={p.display_name || p.username}>{node}</div>
          );
        })}
      </div>
      {extra > 0 && (
        <div
          style={{ height: size + 4, minWidth: size + 4 }}
          className="-ml-2 grid place-items-center border-2 border-white bg-primary px-1.5 font-mono text-[10px] font-black text-primary-foreground"
        >
          +{extra}
        </div>
      )}
    </div>
  );
}
