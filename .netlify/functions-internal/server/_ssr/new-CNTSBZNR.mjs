import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useAuth } from "./router-mgpDFoQE.mjs";
import { s as supabase } from "./client-CZxeSKt5.mjs";
import { u as uploadMedia } from "./upload-y4PVd49O.mjs";
import { t as toast } from "../_libs/sonner.mjs";
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
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
import "../_libs/lucide-react.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
const CATEGORIES = ["AI", "Robotics", "Web", "Mobile", "Hardware", "Game", "DevTool", "Bio", "Other"];
function NewProject() {
  const {
    user
  } = useAuth();
  const nav = useNavigate();
  const [title, setTitle] = reactExports.useState("");
  const [tagline, setTagline] = reactExports.useState("");
  const [description, setDescription] = reactExports.useState("");
  const [techText, setTechText] = reactExports.useState("");
  const [category, setCategory] = reactExports.useState("AI");
  const [github, setGithub] = reactExports.useState("");
  const [demo, setDemo] = reactExports.useState("");
  const [cover, setCover] = reactExports.useState(null);
  const [submitting, setSubmitting] = reactExports.useState(false);
  if (!user) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-10 max-w-md mx-auto text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-2xl mb-4", children: "Log in to ship" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/auth", className: "brutal-btn", children: "Sign in" })
    ] });
  }
  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let cover_url = null;
      if (cover) cover_url = await uploadMedia(cover, user.id, "covers");
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || crypto.randomUUID().slice(0, 8);
      const tech_stack = techText.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 12);
      const {
        data,
        error
      } = await supabase.from("projects").insert({
        owner_id: user.id,
        title,
        slug,
        tagline,
        description,
        tech_stack,
        category,
        github_url: github || null,
        demo_url: demo || null,
        cover_url
      }).select("id").single();
      if (error) throw error;
      toast.success("Project shipped 🚀");
      nav({
        to: "/p/$id",
        params: {
          id: data.id
        }
      });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-3xl mx-auto p-6 md:p-10 pb-24", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pill text-primary", children: "// new project" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display font-black text-4xl mt-2", children: "Ship something insane." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Title", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { required: true, maxLength: 120, value: title, onChange: (e) => setTitle(e.target.value), className: "brutal-input" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "One-line tagline", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { maxLength: 200, value: tagline, onChange: (e) => setTagline(e.target.value), className: "brutal-input", placeholder: "what does it do?" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Description / README (markdown)", children: /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { value: description, onChange: (e) => setDescription(e.target.value), className: "brutal-input min-h-[200px] resize-y", placeholder: "# What it is\\n\\n…" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Tech stack (comma separated)", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: techText, onChange: (e) => setTechText(e.target.value), className: "brutal-input", placeholder: "react, supabase, python" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Category", children: /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: category, onChange: (e) => setCategory(e.target.value), className: "brutal-input", children: CATEGORIES.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: c, children: c }, c)) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "GitHub URL", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: github, onChange: (e) => setGithub(e.target.value), className: "brutal-input", placeholder: "https://github.com/…" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Live demo URL", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: demo, onChange: (e) => setDemo(e.target.value), className: "brutal-input", placeholder: "https://…" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Cover image", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "file", accept: "image/*", onChange: (e) => setCover(e.target.files?.[0] ?? null), className: "brutal-input" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { disabled: submitting, className: "brutal-btn w-full justify-center text-base py-3", children: submitting ? "Shipping…" : "🚀 Ship project" })
    ] })
  ] });
}
function Field({
  label,
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-1", children: label }),
    children
  ] });
}
export {
  NewProject as component
};
