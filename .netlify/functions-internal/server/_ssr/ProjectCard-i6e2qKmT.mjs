import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useAuth, A as Avatar } from "./router-mgpDFoQE.mjs";
import { s as supabase } from "./client-CZxeSKt5.mjs";
import { d as Heart, f as MessageCircle, b as Bookmark, E as ExternalLink, G as Github } from "../_libs/lucide-react.mjs";
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
  const heights = { sm: "h-32", md: "h-44", lg: "h-64" };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "brutal-card overflow-hidden flex flex-col group", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/p/$id", params: { id: project.id }, className: "block relative overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `${heights[size]} relative bg-ink overflow-hidden border-b border-white/10`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 grid-bg opacity-20" }),
      project.cover_url ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "img",
        {
          src: project.cover_url,
          alt: project.title,
          className: "w-full h-full object-cover opacity-70 grayscale-[20%] group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-300"
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 grid place-items-center bg-gradient-to-br from-primary/5 to-transparent", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display font-black text-5xl text-white/10 select-none", children: project.title[0]?.toUpperCase() }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 scan-noise opacity-10" }),
      project.category && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute top-2 left-2 pill bg-black text-white border-white z-10", children: project.category })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 flex-1 flex flex-col gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/p/$id", params: { id: project.id }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display font-bold text-lg leading-tight hover:text-primary", children: project.title }) }),
      project.tagline && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground line-clamp-2", children: project.tagline }),
      project.tech_stack && project.tech_stack.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1 mt-1", children: project.tech_stack.slice(0, 4).map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pill text-muted-foreground", children: t }, t)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mt-auto pt-3 border-t-2 border-white/10", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/u/$username", params: { username: project.owner.username }, className: "flex items-center gap-2 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { profile: project.owner, size: 24 }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-mono truncate", children: [
            "@",
            project.owner.username
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: toggleLike, className: `flex items-center gap-1 px-2 py-1 border-2 ${liked ? "border-[var(--citrus)] text-[var(--citrus)]" : "border-transparent hover:border-white/30"}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Heart, { className: "w-3.5 h-3.5", fill: liked ? "currentColor" : "none" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold", children: likes })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/p/$id", params: { id: project.id }, className: "flex items-center gap-1 px-2 py-1 hover:border-2 hover:border-white/30", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "w-3.5 h-3.5" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold", children: project.comment_count })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: toggleSave, className: `px-2 py-1 border-2 ${saved ? "border-primary text-primary" : "border-transparent hover:border-white/30"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bookmark, { className: "w-3.5 h-3.5", fill: saved ? "currentColor" : "none" }) }),
          project.demo_url && /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: project.demo_url, target: "_blank", rel: "noreferrer", className: "px-2 py-1 hover:border-2 hover:border-white/30", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "w-3.5 h-3.5" }) }),
          project.github_url && /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: project.github_url, target: "_blank", rel: "noreferrer", className: "px-2 py-1 hover:border-2 hover:border-white/30", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Github, { className: "w-3.5 h-3.5" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px] font-mono uppercase text-muted-foreground", children: [
        "shipped ",
        formatDistanceToNow(new Date(project.created_at), { addSuffix: true })
      ] })
    ] })
  ] });
}
export {
  ProjectCard as P
};
