import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { s as supabase } from "./client-CZxeSKt5.mjs";
import { u as useAuth, A as Avatar } from "./router-CUPGUMYq.mjs";
import { P as ProjectCard } from "./ProjectCard-CxNhLHcs.mjs";
import { B as BuildLogCard } from "./BuildLogCard-DdABlUWK.mjs";
import { C as CollabCard } from "./CollabCard-DiKtYen8.mjs";
import { u as uploadMedia } from "./upload-y4PVd49O.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { l as Rocket, p as Sparkles, F as Flame, q as Users, X, L as Link2, I as Image, Z as Zap, m as Send } from "../_libs/lucide-react.mjs";
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
  const [projectId, setProjectId] = reactExports.useState("");
  const [projects, setProjects] = reactExports.useState([]);
  const [submitting, setSubmitting] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (!user) return;
    supabase.from("projects").select("id, title").eq("owner_id", user.id).order("updated_at", { ascending: false }).limit(50).then(({ data }) => setProjects(data ?? []));
  }, [user?.id]);
  const submit = async () => {
    if (!user || !body.trim()) return;
    setSubmitting(true);
    try {
      let image_url = null;
      if (file) image_url = await uploadMedia(file, user.id, "logs");
      const { error } = await supabase.from("build_logs").insert({
        user_id: user.id,
        project_id: projectId || null,
        body: body.trim(),
        image_url
      });
      if (error) throw error;
      setBody("");
      setFile(null);
      setProjectId("");
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
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 rounded-none border-2 border-white/10 bg-black/20 p-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1 block text-[10px] font-mono uppercase tracking-wider text-muted-foreground", children: "Link this log to a project (optional)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link2, { className: "pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: projectId, onChange: (e) => setProjectId(e.target.value), className: "brutal-input pl-8 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Standalone log (not linked)" }),
            projects.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: p.id, children: p.title }, p.id))
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "textarea",
        {
          value: body,
          onChange: (e) => setBody(e.target.value),
          placeholder: projectId ? "Share progress on this project..." : "What are you building right now?",
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
  const [myCollabRequests, setMyCollabRequests] = reactExports.useState([]);
  const [applyTo, setApplyTo] = reactExports.useState(null);
  const [applyMessage, setApplyMessage] = reactExports.useState("");
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
    const projectIds = (p.data ?? []).map((d) => d.id);
    let recentCommentsByProject = {};
    if (projectIds.length > 0) {
      const {
        data: commentsData
      } = await supabase.from("comments").select("id, body, created_at, project_id, user:profiles!comments_user_id_fkey(id, username, display_name, avatar_url)").in("project_id", projectIds).order("created_at", {
        ascending: false
      });
      for (const comment of commentsData ?? []) {
        const key = comment.project_id;
        if (!recentCommentsByProject[key]) recentCommentsByProject[key] = [];
        if (recentCommentsByProject[key].length < 2) recentCommentsByProject[key].push(comment);
      }
    }
    const projects = (p.data ?? []).map((d) => ({
      ...d,
      recent_comments: recentCommentsByProject[d.id] ?? []
    }));
    if (user) {
      const {
        data: reqs
      } = await supabase.from("collab_requests").select("post_id").eq("sender_id", user.id);
      setMyCollabRequests((reqs ?? []).map((r) => r.post_id));
    } else {
      setMyCollabRequests([]);
    }
    const merged = [...projects.map((d) => ({
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
  const applyToCollab = async () => {
    if (!user || !applyTo) return;
    if (myCollabRequests.includes(applyTo.id)) {
      toast.error("You already applied to this collab");
      setApplyTo(null);
      setApplyMessage("");
      return;
    }
    const {
      error
    } = await supabase.from("collab_requests").insert({
      post_id: applyTo.id,
      sender_id: user.id,
      message: applyMessage.trim() || "Hi! I’d love to join this."
    });
    if (error) {
      toast.error(error.message || "Could not send collab request");
      setApplyTo(null);
      setApplyMessage("");
      return;
    }
    toast.success("Request sent");
    setMyCollabRequests((prev) => [...prev, applyTo.id]);
    setApplyTo(null);
    setApplyMessage("");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "feed-shell", children: [
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
    user && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mb-4 space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "brutal-card-flat border-primary/40 bg-[color:color-mix(in_oklab,var(--primary)_7%,var(--card))] p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground", children: "Post options" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-xl font-black leading-tight", children: "Quick build update or full project launch?" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Use log for small progress. Use project launch for something people can save, like, and explore." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/new", className: "brutal-btn justify-center sm:shrink-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Rocket, { className: "h-4 w-4" }),
          " Ship full project"
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Composer, { onPosted: load })
    ] }),
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
    }].map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setTab(t.id), className: `feed-tab flex items-center gap-2 px-4 py-2 font-bold uppercase text-xs tracking-wider border-b-4 ${tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(t.icon, { className: "w-3.5 h-3.5" }),
      " ",
      t.label
    ] }, t.id)) }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "feed-stack", children: Array.from({
      length: 4
    }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "brutal-card-flat h-72 animate-pulse" }, i)) }) : items.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "brutal-card-flat p-10 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground", children: [
      "No activity yet. ",
      tab === "following" && "Follow some builders to see their work here."
    ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "feed-stack", children: items.map((it, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      it.kind === "project" && /* @__PURE__ */ jsxRuntimeExports.jsx(ProjectCard, { project: it.data, accentSeed: i, size: "md" }),
      it.kind === "log" && /* @__PURE__ */ jsxRuntimeExports.jsx(BuildLogCard, { log: it.data }),
      it.kind === "collab" && /* @__PURE__ */ jsxRuntimeExports.jsx(CollabCard, { post: it.data, onApply: user && it.data.user.id !== user.id && !myCollabRequests.includes(it.data.id) ? () => setApplyTo(it.data) : void 0, isApplied: !!(user && myCollabRequests.includes(it.data.id)) })
    ] }, `${it.kind}-${"id" in it.data ? it.data.id : i}`)) }),
    applyTo && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 grid place-items-center bg-black/70 p-4", onClick: () => setApplyTo(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "brutal-card w-full max-w-lg p-6", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-display text-2xl font-bold", children: [
          "Apply to: ",
          applyTo.title
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setApplyTo(null), className: "rounded-none border-2 border-white/20 p-2 hover:border-white/40", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { value: applyMessage, onChange: (e) => setApplyMessage(e.target.value), placeholder: "Why are you a good fit?", className: "brutal-input min-h-[120px] mb-3" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: applyToCollab, className: "brutal-btn w-full justify-center", children: "Send request" })
    ] }) })
  ] });
}
export {
  FeedPage as component
};
