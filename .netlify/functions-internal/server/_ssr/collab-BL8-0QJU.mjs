import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { s as supabase } from "./client-CZxeSKt5.mjs";
import { u as useAuth } from "./router-BZVH0095.mjs";
import { C as CollabCard } from "./CollabCard-CoI4d1IZ.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { i as Plus, X } from "../_libs/lucide-react.mjs";
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
function CollabPage() {
  const {
    user
  } = useAuth();
  const [posts, setPosts] = reactExports.useState([]);
  const [myRequests, setMyRequests] = reactExports.useState([]);
  const [open, setOpen] = reactExports.useState(false);
  const [applyTo, setApplyTo] = reactExports.useState(null);
  const [msg, setMsg] = reactExports.useState("");
  const [title, setTitle] = reactExports.useState("");
  const [desc, setDesc] = reactExports.useState("");
  const [role, setRole] = reactExports.useState("");
  const [tags, setTags] = reactExports.useState("");
  const load = async () => {
    const {
      data
    } = await supabase.from("collab_posts").select("id, title, description, role_needed, tech_tags, is_open, created_at, user:profiles!collab_posts_user_id_fkey(id, username, display_name, avatar_url), project:projects(id, title)").order("created_at", {
      ascending: false
    });
    setPosts(data ?? []);
    if (user) {
      const {
        data: reqs
      } = await supabase.from("collab_requests").select("post_id").eq("sender_id", user.id);
      setMyRequests((reqs ?? []).map((r) => r.post_id));
    }
  };
  reactExports.useEffect(() => {
    load();
  }, [user?.id]);
  const create = async (e) => {
    e.preventDefault();
    if (!user) return;
    const {
      error
    } = await supabase.from("collab_posts").insert({
      user_id: user.id,
      title,
      description: desc,
      role_needed: role || null,
      tech_tags: tags.split(",").map((s) => s.trim()).filter(Boolean)
    });
    if (error) return toast.error(error.message);
    setOpen(false);
    setTitle("");
    setDesc("");
    setRole("");
    setTags("");
    toast.success("Collab posted");
    load();
  };
  const apply = async () => {
    if (!user || !applyTo) return;
    if (myRequests.includes(applyTo.id)) {
      toast.error("You have already applied to this collab");
      setApplyTo(null);
      setMsg("");
      return;
    }
    const {
      data: request,
      error
    } = await supabase.from("collab_requests").insert({
      post_id: applyTo.id,
      sender_id: user.id,
      message: msg
    }).select().single();
    if (error) {
      if (error.code === "23505") {
        toast.error("You have already applied to this collab");
        setMyRequests((prev) => [...prev, applyTo.id]);
      } else {
        toast.error(error.message);
      }
      setApplyTo(null);
      setMsg("");
      return;
    }
    toast.success("Request sent");
    setMyRequests((prev) => [...prev, applyTo.id]);
    setApplyTo(null);
    setMsg("");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-5xl mx-auto p-4 md:p-8 pb-24", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-end justify-between gap-4 mb-6 flex-wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pill text-[var(--grape)]", children: "// collab board" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display font-black text-4xl mt-2", children: "Find your people." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-1", children: "Looking for cofounders, designers, engineers, hackathon teammates." })
      ] }),
      user && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setOpen(true), className: "brutal-btn", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4" }),
        " Post a collab"
      ] }),
      !user && /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/auth", className: "brutal-btn", children: "Sign in to post" })
    ] }),
    posts.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-center py-12", children: "No collab posts yet. Be first." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid md:grid-cols-2 gap-4", children: posts.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(CollabCard, { post: p, onApply: user && p.user.id !== user.id && !myRequests.includes(p.id) ? () => setApplyTo(p) : void 0, isApplied: !!(user && myRequests.includes(p.id)) }, p.id)) }),
    open && /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { onClose: () => setOpen(false), title: "Post a collab", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: create, className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { required: true, placeholder: "Title (e.g. Looking for ML engineer)", value: title, onChange: (e) => setTitle(e.target.value), className: "brutal-input" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { required: true, placeholder: "What are you building? What kind of teammate?", value: desc, onChange: (e) => setDesc(e.target.value), className: "brutal-input min-h-[120px]" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { placeholder: "Role needed (designer, dev, founder…)", value: role, onChange: (e) => setRole(e.target.value), className: "brutal-input" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { placeholder: "Tech tags (comma separated)", value: tags, onChange: (e) => setTags(e.target.value), className: "brutal-input" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "brutal-btn w-full justify-center", children: "Post collab" })
    ] }) }),
    applyTo && /* @__PURE__ */ jsxRuntimeExports.jsxs(Modal, { onClose: () => setApplyTo(null), title: `Apply to: ${applyTo.title}`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { value: msg, onChange: (e) => setMsg(e.target.value), placeholder: "Why are you a good fit?", className: "brutal-input min-h-[120px] mb-3" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: apply, className: "brutal-btn w-full justify-center", children: "Send request" })
    ] })
  ] });
}
function Modal({
  children,
  title,
  onClose
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 bg-black/70 grid place-items-center p-4", onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "brutal-card p-6 w-full max-w-lg", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display font-bold text-xl", children: title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-5 h-5" }) })
    ] }),
    children
  ] }) });
}
export {
  CollabPage as component
};
