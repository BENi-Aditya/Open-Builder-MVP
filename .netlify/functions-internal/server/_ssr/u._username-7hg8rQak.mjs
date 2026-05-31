import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { s as supabase } from "./client-CZxeSKt5.mjs";
import { b as Route$1, u as useAuth, A as Avatar } from "./router-vnISQ9uA.mjs";
import { F as FollowButton } from "./FollowButton-CNQziham.mjs";
import { P as ProjectCard } from "./ProjectCard-CnQ1XTrX.mjs";
import { B as BuildLogCard } from "./BuildLogCard-CANEexNO.mjs";
import "../_libs/sonner.mjs";
import { h as Pen, M as MapPin } from "../_libs/lucide-react.mjs";
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
import "../_libs/date-fns.mjs";
function ProfilePage() {
  const {
    username
  } = Route$1.useParams();
  const {
    user
  } = useAuth();
  const [profile, setProfile] = reactExports.useState(null);
  const [projects, setProjects] = reactExports.useState([]);
  const [logs, setLogs] = reactExports.useState([]);
  const [counts, setCounts] = reactExports.useState({
    followers: 0,
    following: 0
  });
  const [tab, setTab] = reactExports.useState("projects");
  const [loading, setLoading] = reactExports.useState(true);
  reactExports.useEffect(() => {
    (async () => {
      setLoading(true);
      const {
        data: p
      } = await supabase.from("profiles").select("*").eq("username", username).maybeSingle();
      if (!p) {
        setLoading(false);
        return;
      }
      setProfile(p);
      const [{
        data: pr
      }, {
        data: lg
      }, {
        count: fc
      }, {
        count: fgc
      }] = await Promise.all([supabase.from("projects").select("id, title, slug, tagline, cover_url, category, tech_stack, like_count, comment_count, github_url, demo_url, created_at, owner:profiles!projects_owner_id_fkey(id, username, display_name, avatar_url)").eq("owner_id", p.id).eq("visibility", "public").order("created_at", {
        ascending: false
      }), supabase.from("build_logs").select("id, body, image_url, created_at, project_id, project:projects(id, title), user:profiles!build_logs_user_id_fkey(id, username, display_name, avatar_url)").eq("user_id", p.id).order("created_at", {
        ascending: false
      }).limit(30), supabase.from("follows").select("follower_id", {
        count: "exact",
        head: true
      }).eq("following_id", p.id), supabase.from("follows").select("following_id", {
        count: "exact",
        head: true
      }).eq("follower_id", p.id)]);
      setProjects(pr ?? []);
      setLogs(lg ?? []);
      setCounts({
        followers: fc ?? 0,
        following: fgc ?? 0
      });
      setLoading(false);
    })();
  }, [username]);
  if (loading) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-10 text-center text-muted-foreground font-mono", children: "loading..." });
  if (!profile) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-10 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl", children: "Builder not found" }) });
  const isMe = user?.id === profile.id;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pb-24", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-32 md:h-44 relative overflow-hidden bg-ink border-b-2 border-white/10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 grid-bg opacity-30" }),
      profile.banner_url ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: profile.banner_url, alt: "", className: "w-full h-full object-cover opacity-60 grayscale-[30%]" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent opacity-60" })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 scan-noise opacity-20" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-5xl mx-auto px-4 md:px-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-end gap-4 -mt-10 flex-wrap relative z-10", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-ink border-2 border-white shadow-[4px_4px_0_0_rgba(255,255,255,0.9)] overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { profile, size: 100 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0 pb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display font-black text-3xl md:text-4xl leading-none", children: profile.display_name || profile.username }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm font-mono text-muted-foreground", children: [
            "@",
            profile.username
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pb-2 flex gap-2", children: isMe ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/settings", className: "brutal-btn brutal-btn-ghost text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Pen, { className: "w-3 h-3" }),
          " Edit profile"
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(FollowButton, { targetId: profile.id }) })
      ] }),
      profile.bio && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 max-w-2xl", children: profile.bio }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex flex-wrap gap-2 text-xs font-mono text-muted-foreground", children: [
        profile.location && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "w-3 h-3" }),
          " ",
          profile.location
        ] }),
        profile.collab_status && profile.collab_status !== "not_looking" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pill text-[var(--tangerine)]", children: profile.collab_status.replace(/_/g, " ") }),
        profile.currently_building && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "building: ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("b", { className: "text-foreground", children: profile.currently_building })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-6 mt-4 font-mono text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("b", { className: "text-primary", children: projects.length }),
          " projects"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("b", { className: "text-primary", children: counts.followers }),
          " followers"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("b", { className: "text-primary", children: counts.following }),
          " following"
        ] })
      ] }),
      profile.skills && profile.skills.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 flex flex-wrap gap-1", children: profile.skills.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pill text-muted-foreground", children: s }, s)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1 mt-8 mb-4 border-b-2 border-white/10", children: ["projects", "logs"].map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setTab(t), className: `px-4 py-2 font-bold uppercase text-xs tracking-wider border-b-4 ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`, children: t }, t)) }),
      tab === "projects" ? projects.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-center py-12", children: "No projects yet." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid md:grid-cols-2 gap-4", children: projects.map((p, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(ProjectCard, { project: p, accentSeed: i }, p.id)) }) : logs.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-center py-12", children: "No build logs yet." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: logs.map((l) => /* @__PURE__ */ jsxRuntimeExports.jsx(BuildLogCard, { log: l }, l.id)) })
    ] })
  ] });
}
export {
  ProfilePage as component
};
