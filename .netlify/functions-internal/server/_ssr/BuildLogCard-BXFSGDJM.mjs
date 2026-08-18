import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { A as Avatar } from "./router-BZVH0095.mjs";
import { f as formatDistanceToNow } from "../_libs/date-fns.mjs";
import { Z as Zap } from "../_libs/lucide-react.mjs";
function BuildLogCard({ log }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "brutal-card-flat p-4 flex gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { profile: log.user, size: 36 }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/u/$username", params: { username: log.user.username }, className: "font-bold text-sm hover:text-primary", children: log.user.display_name || log.user.username }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-mono text-muted-foreground", children: [
          "@",
          log.user.username
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-mono uppercase text-muted-foreground", children: formatDistanceToNow(new Date(log.created_at), { addSuffix: true }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 mt-1 text-[10px] font-mono uppercase text-[var(--tangerine)]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "w-3 h-3" }),
        " build log",
        log.project && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "·" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/p/$id", params: { id: log.project.id }, className: "hover:text-primary", children: log.project.title })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm whitespace-pre-wrap", children: log.body }),
      log.image_url && /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: log.image_url, alt: "", className: "mt-3 border-2 border-white/20 max-h-96 object-cover" })
    ] })
  ] });
}
export {
  BuildLogCard as B
};
