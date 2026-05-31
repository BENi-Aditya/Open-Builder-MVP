import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { s as supabase } from "./client-CZxeSKt5.mjs";
import { u as useAuth, A as Avatar } from "./router-mgpDFoQE.mjs";
import { P as ProjectCard } from "./ProjectCard-i6e2qKmT.mjs";
import { B as BuildLogCard } from "./BuildLogCard-C83lQAgW.mjs";
import { C as CollabCard } from "./CollabCard-BfBR3kj_.mjs";
import { u as uploadMedia } from "./upload-y4PVd49O.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { m as Sparkles, F as Flame, n as Users, I as Image, Z as Zap, j as Send } from "../_libs/lucide-react.mjs";
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
function Composer({ onPosted }) {
  const { user, profile } = useAuth();
  const [body, setBody] = reactExports.useState("");
  const [file, setFile] = reactExports.useState(null);
  const [submitting, setSubmitting] = reactExports.useState(false);
  const submit = async () => {
    if (!user || !body.trim()) return;
    setSubmitting(true);
    try {
      let image_url = null;
      if (file) image_url = await uploadMedia(file, user.id, "logs");
      const { error } = await supabase.from("build_logs").insert({ user_id: user.id, body: body.trim(), image_url });
      if (error) throw error;
      setBody("");
      setFile(null);
      toast.success("Build log shipped");
      onPosted?.();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };
  if (!user || !profile) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "brutal-card-flat p-4 flex gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { profile, size: 36 }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "textarea",
        {
          value: body,
          onChange: (e) => setBody(e.target.value),
          placeholder: "What are you building right now?",
          className: "brutal-input min-h-[70px] resize-y",
          maxLength: 1e3
        }
      ),
      file && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs font-mono mt-2 text-[var(--tangerine)]", children: [
        "📎 ",
        file.name
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "brutal-btn brutal-btn-ghost text-[10px] py-1.5 cursor-pointer", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { className: "w-3 h-3" }),
          " Image",
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "file", accept: "image/*", hidden: true, onChange: (e) => setFile(e.target.files?.[0] ?? null) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: submit, disabled: submitting || !body.trim(), className: "brutal-btn text-[10px] py-1.5 disabled:opacity-50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "w-3 h-3" }),
          " ",
          submitting ? "Shipping…" : "Post log",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "w-3 h-3" })
        ] })
      ] })
    ] })
  ] });
}
function FeedPage() {
  const {
    user
  } = useAuth();
  const [items, setItems] = reactExports.useState([]);
  const [tab, setTab] = reactExports.useState("all");
  const [loading, setLoading] = reactExports.useState(true);
  const [stats, setStats] = reactExports.useState({
    builders: 0,
    projects: 0
  });
  const load = async () => {
    setLoading(true);
    const [{
      count: bc
    }, {
      count: pc
    }] = await Promise.all([supabase.from("profiles").select("id", {
      count: "exact",
      head: true
    }), supabase.from("projects").select("id", {
      count: "exact",
      head: true
    })]);
    setStats({
      builders: bc ?? 0,
      projects: pc ?? 0
    });
    let followingIds = null;
    if (tab === "following" && user) {
      const {
        data
      } = await supabase.from("follows").select("following_id").eq("follower_id", user.id);
      followingIds = (data ?? []).map((r) => r.following_id);
      if (followingIds.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }
    }
    const projQ = supabase.from("projects").select("id, title, slug, tagline, cover_url, category, tech_stack, like_count, comment_count, github_url, demo_url, created_at, owner:profiles!projects_owner_id_fkey(id, username, display_name, avatar_url)").eq("visibility", "public").limit(20);
    if (followingIds) projQ.in("owner_id", followingIds);
    projQ.order(tab === "trending" ? "like_count" : "created_at", {
      ascending: false
    });
    const logQ = supabase.from("build_logs").select("id, body, image_url, created_at, project_id, project:projects(id, title), user:profiles!build_logs_user_id_fkey(id, username, display_name, avatar_url)").order("created_at", {
      ascending: false
    }).limit(15);
    if (followingIds) logQ.in("user_id", followingIds);
    const collabQ = supabase.from("collab_posts").select("id, title, description, role_needed, tech_tags, is_open, created_at, user:profiles!collab_posts_user_id_fkey(id, username, display_name, avatar_url), project:projects(id, title)").eq("is_open", true).order("created_at", {
      ascending: false
    }).limit(8);
    if (followingIds) collabQ.in("user_id", followingIds);
    const [p, l, c] = await Promise.all([projQ, logQ, collabQ]);
    const merged = [...(p.data ?? []).map((d) => ({
      kind: "project",
      created_at: d.created_at,
      data: d
    })), ...(l.data ?? []).map((d) => ({
      kind: "log",
      created_at: d.created_at,
      data: d
    })), ...(c.data ?? []).map((d) => ({
      kind: "collab",
      created_at: d.created_at,
      data: d
    }))];
    if (tab !== "trending") merged.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    setItems(merged);
    setLoading(false);
  };
  reactExports.useEffect(() => {
    load();
  }, [tab, user?.id]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-6xl mx-auto p-4 md:p-8 pb-24", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "brutal-card-flat p-6 md:p-10 mb-8 relative overflow-hidden scan-noise", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid-bg absolute inset-0 opacity-50" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pill text-primary mb-3 inline-flex", children: "// live builder ecosystem" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "font-display font-black text-4xl md:text-6xl leading-[0.95]", children: [
          "Build publicly.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary", children: "Find your people." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "Ship insane things."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-4 mt-6 font-mono text-xs uppercase tracking-widest text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("b", { className: "text-foreground", children: stats.builders.toLocaleString() }),
            " builders"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("b", { className: "text-foreground", children: stats.projects.toLocaleString() }),
            " projects shipped"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[var(--tangerine)]", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cursor-blink", children: "●" }),
            " activity now"
          ] })
        ] }),
        !user && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 mt-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/auth", className: "brutal-btn", children: "Join the builders" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/explore", className: "brutal-btn brutal-btn-ghost", children: "Explore →" })
        ] })
      ] })
    ] }),
    user && /* @__PURE__ */ jsxRuntimeExports.jsx(Composer, { onPosted: load }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1 mt-6 mb-4 border-b-2 border-white/10 overflow-x-auto", children: [{
      id: "all",
      label: "All",
      icon: Sparkles
    }, {
      id: "trending",
      label: "Trending",
      icon: Flame
    }, {
      id: "following",
      label: "Following",
      icon: Users
    }].map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setTab(t.id), className: `flex items-center gap-2 px-4 py-2 font-bold uppercase text-xs tracking-wider border-b-4 ${tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(t.icon, { className: "w-3.5 h-3.5" }),
      " ",
      t.label
    ] }, t.id)) }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-4", children: Array.from({
      length: 6
    }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "brutal-card-flat h-64 animate-pulse" }, i)) }) : items.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "brutal-card-flat p-10 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground", children: [
      "No activity yet. ",
      tab === "following" && "Follow some builders to see their work here."
    ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "columns-1 md:columns-2 lg:columns-3 gap-4 [column-fill:balance]", children: items.map((it, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "break-inside-avoid mb-4", children: [
      it.kind === "project" && /* @__PURE__ */ jsxRuntimeExports.jsx(ProjectCard, { project: it.data, accentSeed: i, size: i % 5 === 0 ? "lg" : "md" }),
      it.kind === "log" && /* @__PURE__ */ jsxRuntimeExports.jsx(BuildLogCard, { log: it.data }),
      it.kind === "collab" && /* @__PURE__ */ jsxRuntimeExports.jsx(CollabCard, { post: it.data })
    ] }, `${it.kind}-${"id" in it.data ? it.data.id : i}`)) })
  ] });
}
export {
  FeedPage as component
};
