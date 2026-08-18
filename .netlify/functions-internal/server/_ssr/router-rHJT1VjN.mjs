import { Q as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { Q as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { b as createRouter, a as createRootRouteWithContext, e as useRouter, L as Link, O as Outlet, H as HeadContent, S as Scripts, c as createFileRoute, l as lazyRouteComponent, u as useLocation, d as useNavigate } from "../_libs/tanstack__react-router.mjs";
import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { T as Toaster } from "../_libs/sonner.mjs";
import { s as supabase } from "./client-CZxeSKt5.mjs";
import { S as Search, f as House, c as Compass, q as Users, B as Bell, i as MessageSquare, b as Bookmark, k as Plus, n as Settings, g as LogOut, H as Hammer } from "../_libs/lucide-react.mjs";
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
const appCss = "/assets/styles-DeCM_d26.css";
const Ctx = reactExports.createContext({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {
  },
  refreshProfile: async () => {
  }
});
function AuthProvider({ children }) {
  const [session, setSession] = reactExports.useState(null);
  const [profile, setProfile] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const loadProfile = async (uid) => {
    const { data } = await supabase.from("profiles").select("id, username, display_name, avatar_url, banner_url, bio").eq("id", uid).maybeSingle();
    setProfile(data ?? null);
  };
  reactExports.useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s?.user) {
        setTimeout(() => loadProfile(s.user.id), 0);
      } else {
        setProfile(null);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) loadProfile(data.session.user.id);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Ctx.Provider,
    {
      value: {
        user: session?.user ?? null,
        session,
        profile,
        loading,
        signOut: async () => {
          await supabase.auth.signOut();
        },
        refreshProfile: async () => {
          if (session?.user) await loadProfile(session.user.id);
        }
      },
      children
    }
  );
}
const useAuth = () => reactExports.useContext(Ctx);
async function requestBrowserPermission() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }
  return Notification.requestPermission();
}
async function createNotification({
  userId,
  actorId,
  type,
  entityId,
  entityType,
  body,
  title
}) {
  if (!userId || userId === actorId) return null;
  const payload = {
    user_id: userId,
    actor_id: actorId ?? null,
    type,
    entity_id: entityId ?? null,
    entity_type: entityType ?? null,
    body: body ?? null,
    read: false
  };
  const { data, error } = await supabase.from("notifications").insert(payload).select().single();
  if (error) {
    console.warn("Notification insert failed:", error.message);
    return null;
  }
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    const shouldSkipBrowserAlert = document.visibilityState === "visible";
    if (!shouldSkipBrowserAlert) {
      new Notification(title ?? "New activity", {
        body: body || "You have a new notification",
        icon: "/logo.webp",
        tag: `${type}:${entityId ?? userId}`
      });
    }
  }
  return data;
}
const NAV = [
  { to: "/", label: "Feed", icon: House },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/collab", label: "Collab", icon: Users },
  { to: "/notifications", label: "Inbox", icon: Bell },
  { to: "/chat", label: "Messages", icon: MessageSquare },
  { to: "/saved", label: "Saved", icon: Bookmark }
];
function AppShell({ children }) {
  const { user, profile, signOut } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();
  const [unread, setUnread] = reactExports.useState(0);
  const [q, setQ] = reactExports.useState("");
  reactExports.useEffect(() => {
    if (!user) return;
    const promptNotifications = async () => {
      if (typeof window === "undefined") return;
      const hasPrompted = window.localStorage.getItem("openbuilder-notify-prompted") === "1";
      if (hasPrompted) return;
      window.localStorage.setItem("openbuilder-notify-prompted", "1");
      try {
        await requestBrowserPermission();
      } catch {
      }
    };
    promptNotifications();
    const load = async () => {
      const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("read", false);
      setUnread(count ?? 0);
    };
    load();
    const ch = supabase.channel("notif-shell").on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, load).subscribe();
    return () => {
      ch.unsubscribe();
    };
  }, [user]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid min-h-dvh grid-cols-1 grid-bg md:[grid-template-columns:minmax(0,260px)_1fr]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "hidden md:flex flex-col gap-4 border-r-2 border-white/10 p-5 sticky top-0 h-screen overflow-y-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "flex items-center gap-2 mb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "img",
          {
            src: "/logo.webp",
            alt: "studojo",
            className: "w-9 h-9 border-2 border-white object-cover",
            style: { boxShadow: "3px 3px 0 0 #fff" }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-display font-black text-lg leading-none", children: "OPENBUILDER" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-mono uppercase tracking-widest text-muted-foreground", children: "beta // build publicly" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "form",
        {
          onSubmit: (e) => {
            e.preventDefault();
            if (q.trim()) nav({ to: "/explore", search: { q: q.trim() } });
          },
          className: "relative",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: q, onChange: (e) => setQ(e.target.value), placeholder: "search builders, projects", className: "brutal-input pl-8 text-xs" })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "flex flex-col gap-1", children: NAV.map((n) => {
        const active = loc.pathname === n.to || n.to !== "/" && loc.pathname.startsWith(n.to);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Link,
          {
            to: n.to,
            className: `flex items-center justify-between px-3 py-2 border-2 ${active ? "border-white bg-primary text-primary-foreground" : "border-transparent hover:border-white/30"}`,
            style: active ? { boxShadow: "3px 3px 0 0 #fff" } : {},
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-3 font-bold uppercase text-xs tracking-wider", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(n.icon, { className: "w-4 h-4" }),
                " ",
                n.label
              ] }),
              n.to === "/notifications" && unread > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pill bg-destructive text-white border-white", children: unread })
            ]
          },
          n.to
        );
      }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/new", className: "brutal-btn justify-center mt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4" }),
        " Ship a project"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-auto pt-4 border-t-2 border-white/10", children: user && profile ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/u/$username", params: { username: profile.username }, className: "flex items-center gap-3 p-2 hover:bg-white/5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { profile, size: 36 }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-sm truncate", children: profile.display_name || profile.username }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground font-mono truncate", children: [
              "@",
              profile.username
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/settings", className: "brutal-btn brutal-btn-ghost flex-1 text-[10px] py-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { className: "w-3 h-3" }),
            " Settings"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => signOut(), className: "brutal-btn brutal-btn-ghost text-[10px] py-1.5 px-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "w-3 h-3" }) })
        ] })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/auth", className: "brutal-btn w-full justify-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Hammer, { className: "w-4 h-4" }),
        " Join the builders"
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "min-w-0 pb-[calc(5.25rem+env(safe-area-inset-bottom))] md:pb-0", children }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "fixed bottom-0 left-0 right-0 z-50 grid grid-cols-6 border-t-2 border-white bg-card/95 px-1 pb-[max(env(safe-area-inset-bottom),0.35rem)] pt-1 backdrop-blur-sm md:hidden", children: NAV.map((n) => {
      const active = loc.pathname === n.to || n.to !== "/" && loc.pathname.startsWith(n.to);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Link,
        {
          to: n.to,
          className: `flex min-h-14 flex-col items-center justify-center rounded-none border px-1 py-1 text-[9px] font-bold uppercase tracking-tight ${active ? "border-white bg-primary text-primary-foreground" : "border-transparent text-muted-foreground"}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(n.icon, { className: "mb-0.5 h-4 w-4" }),
            n.label
          ]
        },
        n.to
      );
    }) })
  ] });
}
function Avatar({ profile, size = 32 }) {
  if (!profile) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: size, height: size }, className: "bg-muted border-2 border-white" });
  if (profile.avatar_url) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "img",
      {
        src: profile.avatar_url,
        alt: profile.username,
        style: { width: size, height: size },
        className: "border-2 border-white object-cover"
      }
    );
  }
  const letter = (profile.display_name || profile.username || "?")[0].toUpperCase();
  const palette = ["bg-primary text-primary-foreground", "bg-[var(--grape)] text-white", "bg-[var(--tangerine)] text-black", "bg-[var(--sky)] text-black", "bg-[var(--citrus)] text-white"];
  const idx = (profile.username.charCodeAt(0) || 0) % palette.length;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: size, height: size, fontSize: size * 0.45 }, className: `${palette[idx]} border-2 border-white grid place-items-center font-black`, children: letter });
}
function PixelCursor() {
  const cursorRef = reactExports.useRef(null);
  const burstRef = reactExports.useRef(null);
  const [enabled, setEnabled] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (typeof window === "undefined") return;
    const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    setEnabled(!isTouch);
  }, []);
  reactExports.useEffect(() => {
    if (!enabled) return;
    const cursor = cursorRef.current;
    const burst = burstRef.current;
    if (!cursor || !burst) return;
    let raf = 0;
    let x = -100, y = -100;
    let tx = -100, ty = -100;
    const move = (e) => {
      tx = e.clientX;
      ty = e.clientY;
      const t = e.target;
      const isInteractive = !!t.closest("a, button, [role='button'], input, textarea, select, .brutal-card");
      cursor.dataset.hover = isInteractive ? "1" : "0";
    };
    const click = (e) => {
      burst.style.left = `${e.clientX}px`;
      burst.style.top = `${e.clientY}px`;
      burst.classList.remove("animate");
      void burst.offsetWidth;
      burst.classList.add("animate");
    };
    const tick = () => {
      x += (tx - x) * 0.35;
      y += (ty - y) * 0.35;
      cursor.style.transform = `translate(${x}px, ${y}px)`;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mousedown", click);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mousedown", click);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);
  if (!enabled) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .pix-cursor { position: fixed; left: 0; top: 0; width: 20px; height: 20px; pointer-events: none; z-index: 9999; will-change: transform; image-rendering: pixelated; mix-blend-mode: normal; }
        .pix-cursor svg { transition: transform 80ms ease; }
        .pix-cursor[data-hover="1"] svg { transform: scale(1.4) rotate(-6deg); }
        .pix-burst { position: fixed; left: 0; top: 0; width: 24px; height: 24px; pointer-events: none; z-index: 9998; transform: translate(-12px, -12px); }
        .pix-burst.animate { animation: pix-burst .35s steps(4) forwards; }
        @keyframes pix-burst {
          0% { transform: translate(-12px, -12px) scale(0.4); opacity: 1; }
          100% { transform: translate(-12px, -12px) scale(2.2); opacity: 0; }
        }
        @media (max-width: 768px) { .pix-cursor, .pix-burst { display: none; } body, a, button { cursor: auto !important; } }
      ` }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: cursorRef, className: "pix-cursor", "aria-hidden": true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "20", height: "20", viewBox: "0 0 16 16", shapeRendering: "crispEdges", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M2 1h2v1h1v1h1v1h1v1h1v1h1v1h1v1H8v1h1v3H8v-1H7v-1H6v-1H5v1H4v1H3v1H2V1z", fill: "#0a0a0a" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M3 2h1v1h1v1h1v1h1v1h1v1h1v1H7v1h1v2H7v-1H6v-1H5v-1H4v1H3V2z", fill: "#FFD600" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: burstRef, className: "pix-burst", "aria-hidden": true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "24", height: "24", viewBox: "0 0 8 8", shapeRendering: "crispEdges", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "3", y: "0", width: "2", height: "1", fill: "#FFD600" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "3", y: "7", width: "2", height: "1", fill: "#FFD600" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "0", y: "3", width: "1", height: "2", fill: "#FFD600" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "7", y: "3", width: "1", height: "2", fill: "#FFD600" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "1", y: "1", width: "1", height: "1", fill: "#e85d3a" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "6", y: "1", width: "1", height: "1", fill: "#e85d3a" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "1", y: "6", width: "1", height: "1", fill: "#e85d3a" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "6", y: "6", width: "1", height: "1", fill: "#e85d3a" })
    ] }) })
  ] });
}
const Route$c = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "OpenBuilder" },
      { name: "description", content: "OpenBuilder is the social ecosystem for student builders. Ship projects, post build logs, find collaborators." },
      { property: "og:title", content: "OpenBuilder" },
      { property: "og:description", content: "Build publicly. Collaborate openly." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/logo.webp" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "/logo.webp" }
    ],
    links: [
      { rel: "icon", href: "/logo.webp", type: "image/webp" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" }
    ]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: () => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen grid place-items-center p-8 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-display text-7xl font-black", children: "404" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-muted-foreground font-mono uppercase text-xs", children: "page not found" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "brutal-btn mt-4 inline-flex", children: "Back to feed" })
  ] }) }),
  errorComponent: ({ error, reset }) => {
    const router2 = useRouter();
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen grid place-items-center p-8 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-display text-3xl font-black", children: "Something broke" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-muted-foreground font-mono text-xs", children: error.message }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
        router2.invalidate();
        reset();
      }, className: "brutal-btn mt-4", children: "Retry" })
    ] }) });
  }
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("head", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(HeadContent, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("script", { async: true, src: "https://www.googletagmanager.com/gtag/js?id=G-2FM0TXVVTS" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("script", { dangerouslySetInnerHTML: {
        __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-2FM0TXVVTS');
          `
      } })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  const { queryClient } = Route$c.useRouteContext();
  const hasSupabaseConfig = Boolean(
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5cHdrb3BobmJjaW16YnN2ZWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MDczMTcsImV4cCI6MjA5NTM4MzMxN30.dtkpAmvJvWchlcV5ohCAeA-56PDTTAj9i6belkU4LRU"
  );
  if (!hasSupabaseConfig) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen grid place-items-center p-8 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-display text-3xl font-black", children: "OpenBuilder is deploying" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-muted-foreground font-mono text-xs", children: "Missing Supabase environment variables. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in Vercel, then redeploy." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => location.reload(), className: "brutal-btn mt-4", children: "Reload" })
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AuthProvider, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(PixelCursor, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Toaster, { theme: "dark", position: "bottom-right" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}) })
  ] }) });
}
const $$splitComponentImporter$b = () => import("./settings-ZwY0exfB.mjs");
const Route$b = createFileRoute("/settings")({
  component: lazyRouteComponent($$splitComponentImporter$b, "component")
});
const $$splitComponentImporter$a = () => import("./seed-j-rm54Ib.mjs");
const Route$a = createFileRoute("/seed")({
  component: lazyRouteComponent($$splitComponentImporter$a, "component")
});
const $$splitComponentImporter$9 = () => import("./saved-x9Ul5lrD.mjs");
const Route$9 = createFileRoute("/saved")({
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const $$splitComponentImporter$8 = () => import("./notifications-Crr7_OS3.mjs");
const Route$8 = createFileRoute("/notifications")({
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const $$splitComponentImporter$7 = () => import("./new-C1g5K2uY.mjs");
const Route$7 = createFileRoute("/new")({
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./explore-BF54_Unx.mjs");
const Route$6 = createFileRoute("/explore")({
  component: lazyRouteComponent($$splitComponentImporter$6, "component"),
  validateSearch: (s) => ({
    q: s.q || ""
  })
});
const $$splitComponentImporter$5 = () => import("./collab-byNSnosa.mjs");
const Route$5 = createFileRoute("/collab")({
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./chat-DDMDT420.mjs");
const Route$4 = createFileRoute("/chat")({
  component: lazyRouteComponent($$splitComponentImporter$4, "component"),
  validateSearch: (s) => ({
    id: s.id || void 0
  })
});
const $$splitComponentImporter$3 = () => import("./auth-CAhnruiN.mjs");
const Route$3 = createFileRoute("/auth")({
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./index-DuGmHJuA.mjs");
const Route$2 = createFileRoute("/")({
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./u._username-rxzgJdQk.mjs");
const Route$1 = createFileRoute("/u/$username")({
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./p._id-DQrFg9AQ.mjs");
const Route = createFileRoute("/p/$id")({
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const SettingsRoute = Route$b.update({
  id: "/settings",
  path: "/settings",
  getParentRoute: () => Route$c
});
const SeedRoute = Route$a.update({
  id: "/seed",
  path: "/seed",
  getParentRoute: () => Route$c
});
const SavedRoute = Route$9.update({
  id: "/saved",
  path: "/saved",
  getParentRoute: () => Route$c
});
const NotificationsRoute = Route$8.update({
  id: "/notifications",
  path: "/notifications",
  getParentRoute: () => Route$c
});
const NewRoute = Route$7.update({
  id: "/new",
  path: "/new",
  getParentRoute: () => Route$c
});
const ExploreRoute = Route$6.update({
  id: "/explore",
  path: "/explore",
  getParentRoute: () => Route$c
});
const CollabRoute = Route$5.update({
  id: "/collab",
  path: "/collab",
  getParentRoute: () => Route$c
});
const ChatRoute = Route$4.update({
  id: "/chat",
  path: "/chat",
  getParentRoute: () => Route$c
});
const AuthRoute = Route$3.update({
  id: "/auth",
  path: "/auth",
  getParentRoute: () => Route$c
});
const IndexRoute = Route$2.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$c
});
const UUsernameRoute = Route$1.update({
  id: "/u/$username",
  path: "/u/$username",
  getParentRoute: () => Route$c
});
const PIdRoute = Route.update({
  id: "/p/$id",
  path: "/p/$id",
  getParentRoute: () => Route$c
});
const rootRouteChildren = {
  IndexRoute,
  AuthRoute,
  ChatRoute,
  CollabRoute,
  ExploreRoute,
  NewRoute,
  NotificationsRoute,
  SavedRoute,
  SeedRoute,
  SettingsRoute,
  PIdRoute,
  UUsernameRoute
};
const routeTree = Route$c._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const queryClient = new QueryClient();
  const router2 = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  Avatar as A,
  Route$6 as R,
  Route$4 as a,
  Route$1 as b,
  Route as c,
  createNotification as d,
  router as r,
  useAuth as u
};
