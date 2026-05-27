import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { s as supabase } from "./client-BkH9hjXP.mjs";
import { u as useAuth } from "./router-BEE4HkqR.mjs";
import { P as ProjectCard } from "./ProjectCard-BWf-Zxjy.mjs";
import "../_libs/sonner.mjs";
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
import "../_libs/lucide-react.mjs";
import "../_libs/date-fns.mjs";
function SavedPage() {
  const {
    user
  } = useAuth();
  const [items, setItems] = reactExports.useState([]);
  reactExports.useEffect(() => {
    if (!user) return;
    (async () => {
      const {
        data
      } = await supabase.from("saves").select("project:projects(id, title, slug, tagline, cover_url, category, tech_stack, like_count, comment_count, github_url, demo_url, created_at, owner:profiles!projects_owner_id_fkey(id, username, display_name, avatar_url))").eq("user_id", user.id).order("created_at", {
        ascending: false
      });
      setItems((data ?? []).map((r) => r.project).filter(Boolean));
    })();
  }, [user?.id]);
  if (!user) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-10 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/auth", className: "brutal-btn", children: "Sign in" }) });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-6xl mx-auto p-4 md:p-8 pb-24", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display font-black text-4xl mb-6", children: "Saved" }),
    items.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Nothing saved yet." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-4", children: items.map((p, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(ProjectCard, { project: p, accentSeed: i }, p.id)) })
  ] });
}
export {
  SavedPage as component
};
