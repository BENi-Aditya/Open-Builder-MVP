import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { s as supabase } from "./client-CZxeSKt5.mjs";
import { P as ProjectCard } from "./ProjectCard-CxNhLHcs.mjs";
import { R as Route$6, A as Avatar } from "./router-CUPGUMYq.mjs";
import { F as FollowButton } from "./FollowButton-CJDXzybV.mjs";
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
import "../_libs/lucide-react.mjs";
import "../_libs/date-fns.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
function Explore() {
  const {
    q
  } = Route$6.useSearch();
  const [query, setQuery] = reactExports.useState(q);
  const [projects, setProjects] = reactExports.useState([]);
  const [builders, setBuilders] = reactExports.useState([]);
  const [cat, setCat] = reactExports.useState(null);
  const CATS = ["AI", "Robotics", "Web", "Mobile", "Hardware", "Game", "DevTool"];
  reactExports.useEffect(() => {
    (async () => {
      const proj = supabase.from("projects").select("id, title, slug, tagline, cover_url, category, tech_stack, like_count, comment_count, github_url, demo_url, created_at, owner:profiles!projects_owner_id_fkey(id, username, display_name, avatar_url)").eq("visibility", "public").order("like_count", {
        ascending: false
      }).limit(30);
      if (cat) proj.eq("category", cat);
      if (query) proj.or(`title.ilike.%${query}%,tagline.ilike.%${query}%`);
      const {
        data: pr
      } = await proj;
      setProjects(pr ?? []);
      const blds = supabase.from("profiles").select("*").limit(12);
      if (query) blds.or(`username.ilike.%${query}%,display_name.ilike.%${query}%,bio.ilike.%${query}%`);
      const {
        data: bl
      } = await blds;
      setBuilders(bl ?? []);
    })();
  }, [query, cat]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-6xl mx-auto p-4 md:p-8 pb-24", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display font-black text-4xl mb-6", children: "Explore" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: query, onChange: (e) => setQuery(e.target.value), placeholder: "search projects, builders…", className: "brutal-input mb-4" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2 mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setCat(null), className: `pill ${cat === null ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground"}`, children: "All" }),
      CATS.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setCat(c), className: `pill ${cat === c ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground"}`, children: c }, c))
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mb-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display font-bold text-2xl mb-4", children: "Projects" }),
      projects.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Nothing matches." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-4", children: projects.map((p, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(ProjectCard, { project: p, accentSeed: i }, p.id)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display font-bold text-2xl mb-4", children: "Builders" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid sm:grid-cols-2 md:grid-cols-3 gap-3", children: builders.map((b) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "brutal-card-flat p-4 flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/u/$username", params: {
          username: b.username
        }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { profile: b, size: 44 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/u/$username", params: {
            username: b.username
          }, className: "font-bold text-sm hover:text-primary", children: b.display_name || b.username }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs font-mono text-muted-foreground truncate", children: [
            "@",
            b.username
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(FollowButton, { targetId: b.id, size: "sm" })
      ] }, b.id)) })
    ] })
  ] });
}
export {
  Explore as component
};
