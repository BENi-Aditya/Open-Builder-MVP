import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Avatar } from "@/components/AppShell";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, UserPlus, Users, Bell, Check, X, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { createNotification } from "@/lib/notifications";

export const Route = createFileRoute("/notifications")({ component: NotificationsPage });

const ICONS: Record<string, any> = { 
  like: Heart, 
  comment: MessageCircle, 
  follow: UserPlus, 
  collab_request: Users,
  collab_accepted: Check,
  chat_message: MessageSquare
};

function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState<any[]>([]);
  const [requests, setRequests] = useState<Record<string, any>>({});

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("notifications").select("*, actor:profiles!notifications_actor_id_fkey(id, username, display_name, avatar_url)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
    setNotifs(data ?? []);
    
    // Load request statuses for collab_requests
    const collabNotifs = data?.filter(n => n.type === "collab_request") || [];
    let reqMap: Record<string, any> = {};

    const collabReqIdNotifs = collabNotifs.filter((n) => n.entity_type === "collab_request");
    const collabPostNotifs = collabNotifs.filter((n) => n.entity_type === "collab_post" || n.entity_type === "collab");

    const reqIds = collabReqIdNotifs.map((n) => n.entity_id).filter(Boolean) as string[];
    if (reqIds.length) {
      const { data: reqData } = await supabase.from("collab_requests").select("*, post:collab_posts(title)").in("id", reqIds);
      for (const r of reqData ?? []) {
        reqMap[r.id] = r;
      }
    }

    for (const n of collabPostNotifs) {
      const postId = n.entity_id as string | null;
      if (!postId || !n.actor_id) continue;
      const { data: r } = await supabase
        .from("collab_requests")
        .select("*, post:collab_posts(title)")
        .eq("post_id", postId)
        .eq("sender_id", n.actor_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (r) {
        reqMap[r.id] = r;
        reqMap[postId] = r;
      }
    }

    setRequests(reqMap);
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
  };

  const handleRequest = async (requestId: string, status: "accepted" | "rejected") => {
    const request = requests[requestId];
    if (!request) return;

    if (status === "accepted") {
      const { data: chatId, error } = await (supabase as any).rpc("accept_collab_request", { request_id: requestId });
      if (error) return toast.error(error.message);

      await createNotification({
        userId: request.sender_id,
        actorId: user?.id ?? null,
        type: "collab_accepted",
        entityId: requestId,
        entityType: "collab_request",
        body: `Your collab request was accepted`,
      });

      toast.success("Request accepted! Chat started.");
      navigate({ to: "/chat", search: { id: chatId } });
    } else {
      const { error } = await supabase.from("collab_requests").update({ status }).eq("id", requestId);
      if (error) return toast.error(error.message);
      await createNotification({
        userId: request.sender_id,
        actorId: user?.id ?? null,
        type: "collab_accepted",
        entityId: requestId,
        entityType: "collab_request",
        body: `Your collab request was declined`,
      });
      toast.success("Request declined");
    }
    load();
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
      <h1 className="font-display font-black text-4xl mb-8 flex items-center gap-4 uppercase tracking-tighter">
        <Bell className="w-8 h-8" /> Inbox
      </h1>
      {notifs.length === 0 ? (
        <div className="brutal-card p-12 text-center bg-card border-white shadow-[8px_8px_0_0_rgba(255,255,255,0.1)]">
          <p className="font-mono text-sm uppercase text-muted-foreground">The console is silent.</p>
          <p className="mt-2 font-display font-bold text-lg">Nothing yet. Go ship something.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifs.map((n) => {
            const Icon = ICONS[n.type] ?? Bell;
            const request = n.type === "collab_request" ? requests[n.entity_id!] : null;
            const isPending = request?.status === 'pending';

            const link = n.type === "chat_message" ? `/chat?id=${n.entity_id}` : n.entity_type === "project" ? `/p/${n.entity_id}` : n.entity_type === "profile" ? `/u/${n.actor?.username}` : n.type === "collab_request" ? `/collab` : "/collab";
            
            return (
              <div key={n.id} className="brutal-card-flat p-4 flex items-center gap-4 hover:border-white transition-colors bg-card/50 group relative overflow-hidden">
                {/* Background Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 -rotate-45 translate-x-16 -translate-y-16 pointer-events-none" />
                
                <Link to={link} className="contents">
                  <div className="relative">
                    <Avatar profile={n.actor} size={44} />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white border-2 border-black flex items-center justify-center">
                      <Icon className="w-3 h-3 text-black" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-display font-bold uppercase tracking-tight">
                      <span className="text-primary">{n.actor?.display_name || n.actor?.username || "Someone"}</span> {labelFor(n.type)}
                    </div>
                    {n.body && <div className="text-xs font-mono text-muted-foreground truncate mt-1 uppercase opacity-80">{n.body}</div>}
                    <div className="text-[9px] font-mono uppercase text-muted-foreground mt-2 flex items-center gap-1">
                      <div className="w-1 h-1 bg-muted-foreground" />
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </Link>

                {n.type === "collab_request" && isPending && (
                  <div className="flex gap-2 ml-auto shrink-0">
                    <button 
                      onClick={() => handleRequest(request.id, "accepted")} 
                      className="p-2 border-2 border-green-500 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-all shadow-[2px_2px_0_0_rgba(34,197,94,0.3)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]" 
                      title="Accept"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleRequest(request.id, "rejected")} 
                      className="p-2 border-2 border-red-500 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-[2px_2px_0_0_rgba(239,68,68,0.3)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]" 
                      title="Decline"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
                
                {n.type === "collab_request" && request && !isPending && (
                  <div className="ml-auto text-[10px] font-mono font-black uppercase px-3 py-1 border-2 border-white/20 bg-muted/20 text-muted-foreground rotate-2">
                    {request.status}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function labelFor(type: string) {
  return { 
    like: "liked your project", 
    comment: "commented on your project", 
    follow: "started following you", 
    collab_request: "wants to collab", 
    collab_accepted: "accepted your request", 
    build_log: "posted a build log",
    chat_message: "sent you a message"
  }[type] ?? type;
}
