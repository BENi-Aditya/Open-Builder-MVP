import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { s as supabase } from "./client-CZxeSKt5.mjs";
import { u as useAuth, A as Avatar, d as createNotification } from "./router-rHJT1VjN.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { B as Bell, i as MessageSquare, C as Check, q as Users, U as UserPlus, h as MessageCircle, e as Heart, X } from "../_libs/lucide-react.mjs";
import { f as formatDistanceToNow } from "../_libs/date-fns.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
const ICONS = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  collab_request: Users,
  collab_accepted: Check,
  chat_message: MessageSquare
};
function NotificationsPage() {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [notifs, setNotifs] = reactExports.useState([]);
  const [requests, setRequests] = reactExports.useState({});
  const load = async () => {
    if (!user) return;
    const {
      data
    } = await supabase.from("notifications").select("*, actor:profiles!notifications_actor_id_fkey(id, username, display_name, avatar_url)").eq("user_id", user.id).order("created_at", {
      ascending: false
    }).limit(100);
    const sorted = [...data ?? []].sort((a, b) => {
      const aPriority = a.type === "collab_request" ? 0 : 1;
      const bPriority = b.type === "collab_request" ? 0 : 1;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return +new Date(b.created_at) - +new Date(a.created_at);
    });
    setNotifs(sorted);
    const collabNotifs = data?.filter((n) => n.type === "collab_request") || [];
    let reqMap = {};
    const collabReqIdNotifs = collabNotifs.filter((n) => n.entity_type === "collab_request");
    const collabPostNotifs = collabNotifs.filter((n) => n.entity_type === "collab_post" || n.entity_type === "collab");
    const reqIds = collabReqIdNotifs.map((n) => n.entity_id).filter(Boolean);
    if (reqIds.length) {
      const {
        data: reqData
      } = await supabase.from("collab_requests").select("*, post:collab_posts(title)").in("id", reqIds);
      for (const r of reqData ?? []) {
        reqMap[r.id] = r;
      }
    }
    for (const n of collabPostNotifs) {
      const postId = n.entity_id;
      if (!postId || !n.actor_id) continue;
      const {
        data: r
      } = await supabase.from("collab_requests").select("*, post:collab_posts(title)").eq("post_id", postId).eq("sender_id", n.actor_id).order("created_at", {
        ascending: false
      }).limit(1).maybeSingle();
      if (r) {
        reqMap[r.id] = r;
        reqMap[postId] = r;
      }
    }
    setRequests(reqMap);
    await supabase.from("notifications").update({
      read: true
    }).eq("user_id", user.id).eq("read", false);
  };
  const handleRequest = async (requestId, status) => {
    const request = requests[requestId];
    if (!request) return;
    if (status === "accepted") {
      const {
        data: chatId,
        error
      } = await supabase.rpc("accept_collab_request", {
        request_id: requestId
      });
      if (error) return toast.error(error.message);
      await createNotification({
        userId: request.sender_id,
        actorId: user?.id ?? null,
        type: "collab_accepted",
        entityId: requestId,
        entityType: "collab_request",
        body: `Your collab request was accepted`
      });
      toast.success("Request accepted! Chat started.");
      navigate({
        to: "/chat",
        search: {
          id: chatId
        }
      });
    } else {
      const {
        error
      } = await supabase.from("collab_requests").update({
        status
      }).eq("id", requestId);
      if (error) return toast.error(error.message);
      await createNotification({
        userId: request.sender_id,
        actorId: user?.id ?? null,
        type: "collab_accepted",
        entityId: requestId,
        entityType: "collab_request",
        body: `Your collab request was declined`
      });
      toast.success("Request declined");
    }
    load();
  };
  reactExports.useEffect(() => {
    load();
  }, [user?.id]);
  reactExports.useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("notif-page").on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "notifications",
      filter: `user_id=eq.${user.id}`
    }, load).subscribe();
    return () => {
      ch.unsubscribe();
    };
  }, [user?.id]);
  if (!user) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-10 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/auth", className: "brutal-btn", children: "Sign in" }) });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-3xl mx-auto p-4 md:p-8 pb-24", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "font-display font-black text-4xl mb-8 flex items-center gap-4 uppercase tracking-tighter", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "w-8 h-8" }),
      " Inbox"
    ] }),
    notifs.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "brutal-card p-12 text-center bg-card border-white shadow-[8px_8px_0_0_rgba(255,255,255,0.1)]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-sm uppercase text-muted-foreground", children: "The console is silent." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 font-display font-bold text-lg", children: "Nothing yet. Go ship something." })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: notifs.map((n) => {
      const Icon = ICONS[n.type] ?? Bell;
      const request = n.type === "collab_request" ? requests[n.entity_id] : null;
      const isPending = request?.status === "pending";
      const isCollabRequest = n.type === "collab_request";
      const link = n.type === "chat_message" ? `/chat?id=${n.entity_id}` : n.entity_type === "project" ? `/p/${n.entity_id}` : n.entity_type === "profile" ? `/u/${n.actor?.username}` : n.type === "collab_request" ? `/collab` : "/collab";
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `brutal-card-flat p-4 flex items-center gap-4 hover:border-white transition-colors group relative overflow-hidden ${isCollabRequest ? "border-[var(--tangerine)] bg-[color:color-mix(in_oklab,var(--tangerine)_12%,var(--card))]" : "bg-card/50"}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `absolute top-0 right-0 w-32 h-32 -rotate-45 translate-x-16 -translate-y-16 pointer-events-none ${isCollabRequest ? "bg-[var(--tangerine)]/20" : "bg-primary/5"}` }),
        isCollabRequest && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute right-2 top-2 border border-[var(--tangerine)] bg-black/70 px-2 py-0.5 text-[9px] font-mono font-black uppercase tracking-wider text-[var(--tangerine)]", children: "Collab request" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: link, className: "contents", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { profile: n.actor, size: 44 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -bottom-1 -right-1 w-5 h-5 bg-white border-2 border-black flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "w-3 h-3 text-black" }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm font-display font-bold uppercase tracking-tight", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary", children: n.actor?.display_name || n.actor?.username || "Someone" }),
              " ",
              labelFor(n.type)
            ] }),
            n.body && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-mono text-muted-foreground truncate mt-1 uppercase opacity-80", children: n.body }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[9px] font-mono uppercase text-muted-foreground mt-2 flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-1 h-1 bg-muted-foreground" }),
              formatDistanceToNow(new Date(n.created_at), {
                addSuffix: true
              })
            ] })
          ] })
        ] }),
        n.type === "collab_request" && isPending && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 ml-auto shrink-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => handleRequest(request.id, "accepted"), className: "p-2 border-2 border-green-500 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-all shadow-[2px_2px_0_0_rgba(34,197,94,0.3)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]", title: "Accept", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "w-5 h-5" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => handleRequest(request.id, "rejected"), className: "p-2 border-2 border-red-500 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-[2px_2px_0_0_rgba(239,68,68,0.3)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]", title: "Decline", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-5 h-5" }) })
        ] }),
        n.type === "collab_request" && request && !isPending && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ml-auto text-[10px] font-mono font-black uppercase px-3 py-1 border-2 border-white/20 bg-muted/20 text-muted-foreground rotate-2", children: request.status })
      ] }, n.id);
    }) })
  ] });
}
function labelFor(type) {
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
export {
  NotificationsPage as component
};
