import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { A as Avatar } from "./router-mgpDFoQE.mjs";
import { n as Users, a as ArrowRight } from "../_libs/lucide-react.mjs";
import { f as formatDistanceToNow } from "../_libs/date-fns.mjs";
function CollabCard({ post, onApply, isApplied }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "brutal-card p-5 flex flex-col gap-3", style: { background: "linear-gradient(135deg, var(--card) 0%, color-mix(in oklab, var(--grape) 10%, var(--card)) 100%)" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "pill bg-[var(--grape)] text-white border-white", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "w-3 h-3 mr-1" }),
          " collab"
        ] }),
        post.role_needed && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pill text-[var(--tangerine)]", children: post.role_needed }),
        !post.is_open && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pill text-muted-foreground", children: "closed" }),
        isApplied && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pill bg-green-500/20 text-green-500 border-green-500/50", children: "Applied" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-mono text-muted-foreground", children: formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display font-bold text-xl leading-tight", children: post.title }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4", children: post.description }),
    post.tech_tags && post.tech_tags.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1", children: post.tech_tags.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pill text-muted-foreground", children: t }, t)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mt-2 pt-3 border-t-2 border-white/10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/u/$username", params: { username: post.user.username }, className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { profile: post.user, size: 28 }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-bold leading-none", children: post.user.display_name || post.user.username }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px] font-mono text-muted-foreground", children: [
            "@",
            post.user.username
          ] })
        ] })
      ] }),
      post.is_open && onApply && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: onApply, className: "brutal-btn text-[10px] py-1.5", children: [
        "Apply ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "w-3 h-3" })
      ] })
    ] })
  ] });
}
export {
  CollabCard as C
};
