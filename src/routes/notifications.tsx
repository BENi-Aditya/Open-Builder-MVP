import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Avatar } from "@/components/AppShell";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, UserPlus, Users, Bell } from "lucide-react";

export const Route = createFileRoute("/notifications")({ component: NotificationsPage });

const ICONS: Record<string, any> = { like: Heart, comment: MessageCircle, follow: UserPlus, collab_request: Users };

function NotificationsPage() {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState<any[]>([]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("notifications").select("*, actor:profiles!notifications_actor_id_fkey(id, username, display_name, avatar_url)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
    setNotifs(data ?? []);
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
  };

  useEffect(() => { load(); }, [user?.id]);
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("notif-page").on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, load).subscribe();
    return () => { ch.unsubscribe(); };
  }, [user?.id]);

  if (!user) return <div className="p-10 text-center"><Link to="/auth" className="brutal-btn">Sign in</Link></div>;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 pb-24">
      <h1 className="font-display font-black text-4xl mb-6 flex items-center gap-3"><Bell /> Inbox</h1>
      {notifs.length === 0 ? <p className="text-muted-foreground text-center py-12">Nothing yet. Go ship something.</p> : (
        <div className="space-y-2">
          {notifs.map((n) => {
            const Icon = ICONS[n.type] ?? Bell;
            const link = n.entity_type === "project" ? `/p/${n.entity_id}` : n.entity_type === "profile" ? `/u/${n.actor?.username}` : "/collab";
            return (
              <Link key={n.id} to={link} className="brutal-card-flat p-3 flex items-center gap-3 hover:border-primary">
                <Avatar profile={n.actor} size={36} />
                <Icon className="w-4 h-4 text-[var(--tangerine)]" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm"><b>{n.actor?.display_name || n.actor?.username || "Someone"}</b> {labelFor(n.type)}</div>
                  {n.body && <div className="text-xs text-muted-foreground truncate">{n.body}</div>}
                  <div className="text-[10px] font-mono uppercase text-muted-foreground">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function labelFor(type: string) {
  return { like: "liked your project", comment: "commented on your project", follow: "started following you", collab_request: "wants to collab", collab_accepted: "accepted your request", build_log: "posted a build log" }[type] ?? type;
}
