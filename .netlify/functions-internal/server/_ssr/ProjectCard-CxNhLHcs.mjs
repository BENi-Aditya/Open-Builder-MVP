import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useAuth, A as Avatar, d as createNotification } from "./router-CUPGUMYq.mjs";
import { s as supabase } from "./client-CZxeSKt5.mjs";
import { b as Bookmark, e as Heart, h as MessageCircle, E as ExternalLink, G as Github } from "../_libs/lucide-react.mjs";
import { f as formatDistanceToNow } from "../_libs/date-fns.mjs";
function ProjectCard({ project, accentSeed = 0, size = "md" }) {
  const { user } = useAuth();
  const [liked, setLiked] = reactExports.useState(false);
  const [saved, setSaved] = reactExports.useState(false);
  const [likes, setLikes] = reactExports.useState(project.like_count);
  reactExports.useEffect(() => {
    if (!user) return;
    supabase.from("likes").select("user_id").eq("user_id", user.id).eq("project_id", project.id).maybeSingle().then(({ data }) => setLiked(!!data));
    supabase.from("saves").select("user_id").eq("user_id", user.id).eq("project_id", project.id).maybeSingle().then(({ data }) => setSaved(!!data));
  }, [user, project.id]);
  const toggleLike = async () => {
    if (!user) return;
    if (liked) {
      await supabase.from("likes").delete().eq("user_id", user.id).eq("project_id", project.id);
      setLiked(false);
      setLikes((n) => Math.max(0, n - 1));
    } else {
      await supabase.from("likes").insert({ user_id: user.id, project_id: project.id });
      setLiked(true);
      setLikes((n) => n + 1);
      await createNotification({
        userId: project.owner.id,
        actorId: user.id,
        type: "like",
        entityId: project.id,
        entityType: "project",
        body: `${user.user_metadata?.username || "Someone"} liked your project`
      });
    }
  };
  const toggleSave = async () => {
    if (!user) return;
    if (saved) {
      await supabase.from("saves").delete().eq("user_id", user.id).eq("project_id", project.id);
      setSaved(false);
    } else {
      await supabase.from("saves").insert({ user_id: user.id, project_id: project.id });
      setSaved(true);
    }
  };
  const heights = { sm: "h-40", md: "h-56", lg: "h-72" };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "feed-item-card brutal-card group flex w-full flex-col overflow-hidden bg-[color:var(--card)] transition-all duration-200 hover:-translate-y-0.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 border-b-2 border-white/10 px-3 py-2.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/u/$username", params: { username: project.owner.username }, className: "flex min-w-0 items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { profile: project.owner, size: 28 }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate text-xs font-bold", children: project.owner.display_name || project.owner.username }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "truncate text-[10px] font-mono text-muted-foreground", children: [
            "@",
            project.owner.username
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: toggleSave,
          "aria-label": saved ? "Remove save" : "Save project",
          className: `shrink-0 border-2 p-1.5 transition-colors ${saved ? "border-primary bg-primary text-primary-foreground" : "border-transparent hover:border-white/30 hover:bg-white/5"}`,
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bookmark, { className: "h-3.5 w-3.5", fill: saved ? "currentColor" : "none" })
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/p/$id", params: { id: project.id }, className: "block relative overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `${heights[size]} relative bg-ink overflow-hidden`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 grid-bg opacity-20" }),
      project.cover_url ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "img",
        {
          src: project.cover_url,
          alt: project.title,
          className: "h-full w-full object-cover opacity-90 transition-transform duration-300 group-hover:scale-[1.02]"
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 grid place-items-center bg-gradient-to-br from-primary/10 via-transparent to-[var(--grape)]/30", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display font-black text-5xl text-white/10 select-none", children: project.title[0]?.toUpperCase() }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 scan-noise opacity-10" }),
      project.category && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-3 top-3 pill bg-black text-white border-white z-10", children: project.category })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 flex-col gap-2 p-3.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/p/$id", params: { id: project.id }, className: "min-w-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-xl font-black leading-tight hover:text-primary", children: project.title }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground", children: formatDistanceToNow(new Date(project.created_at), { addSuffix: true }) })
      ] }),
      project.tagline && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm leading-relaxed text-muted-foreground line-clamp-2", children: project.tagline }),
      project.tech_stack && project.tech_stack.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1.5", children: project.tech_stack.slice(0, 3).map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pill text-muted-foreground", children: t }, t)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex items-center justify-between gap-2 border-t-2 border-white/10 pt-2.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: toggleLike,
              className: `flex items-center gap-1.5 border-2 px-2 py-1 text-xs font-bold transition-colors ${liked ? "border-[var(--citrus)] bg-[var(--citrus)]/10 text-[var(--citrus)]" : "border-transparent hover:border-white/30 hover:bg-white/5"}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Heart, { className: "h-3.5 w-3.5", fill: liked ? "currentColor" : "none" }),
                likes
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/p/$id", params: { id: project.id }, className: "flex items-center gap-1.5 border-2 border-transparent px-2 py-1 text-xs font-bold hover:border-white/30 hover:bg-white/5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "h-3.5 w-3.5" }),
            project.comment_count
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-muted-foreground", children: [
          project.demo_url && /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: project.demo_url, target: "_blank", rel: "noreferrer", className: "border-2 border-transparent p-1.5 hover:border-white/30 hover:bg-white/5", "aria-label": "Open demo", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-3.5 w-3.5" }) }),
          project.github_url && /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: project.github_url, target: "_blank", rel: "noreferrer", className: "border-2 border-transparent p-1.5 hover:border-white/30 hover:bg-white/5", "aria-label": "Open GitHub", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Github, { className: "h-3.5 w-3.5" }) })
        ] })
      ] }),
      project.recent_comments && project.recent_comments.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 border-t-2 border-white/10 pt-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 flex items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground", children: "Comments" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/p/$id", params: { id: project.id }, className: "text-[10px] font-mono uppercase tracking-[0.12em] text-primary hover:text-primary/80", children: "View all" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: project.recent_comments.slice(0, 2).map((comment) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 rounded-none border border-white/10 bg-white/[0.02] p-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { profile: comment.user, size: 22 }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-[10px] font-mono text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-foreground", children: comment.user.display_name || comment.user.username }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "@",
                comment.user.username
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs leading-relaxed text-muted-foreground line-clamp-2", children: comment.body })
          ] })
        ] }, comment.id)) })
      ] })
    ] })
  ] });
}
export {
  ProjectCard as P
};
