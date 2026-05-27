import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { s as supabase } from "./client-BkH9hjXP.mjs";
import { u as useAuth, A as Avatar } from "./router-BEE4HkqR.mjs";
import "../_libs/sonner.mjs";
import { B as Bell, i as Users, U as UserPlus, d as MessageCircle, b as Heart } from "../_libs/lucide-react.mjs";
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
  collab_request: Users
};
function NotificationsPage() {
  const {
    user
  } = useAuth();
  const [notifs, setNotifs] = reactExports.useState([]);
  const load = async () => {
    if (!user) return;
    const {
      data
    } = await supabase.from("notifications").select("*, actor:profiles!notifications_actor_id_fkey(id, username, display_name, avatar_url)").eq("user_id", user.id).order("created_at", {
      ascending: false
    }).limit(100);
    setNotifs(data ?? []);
    await supabase.from("notifications").update({
      read: true
    }).eq("user_id", user.id).eq("read", false);
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
    /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "font-display font-black text-4xl mb-6 flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, {}),
      " Inbox"
    ] }),
    notifs.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-center py-12", children: "Nothing yet. Go ship something." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: notifs.map((n) => {
      const Icon = ICONS[n.type] ?? Bell;
      const link = n.entity_type === "project" ? `/p/${n.entity_id}` : n.entity_type === "profile" ? `/u/${n.actor?.username}` : "/collab";
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: link, className: "brutal-card-flat p-3 flex items-center gap-3 hover:border-primary", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { profile: n.actor, size: 36 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "w-4 h-4 text-[var(--tangerine)]" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: n.actor?.display_name || n.actor?.username || "Someone" }),
            " ",
            labelFor(n.type)
          ] }),
          n.body && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground truncate", children: n.body }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-mono uppercase text-muted-foreground", children: formatDistanceToNow(new Date(n.created_at), {
            addSuffix: true
          }) })
        ] })
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
    build_log: "posted a build log"
  }[type] ?? type;
}
export {
  NotificationsPage as component
};
