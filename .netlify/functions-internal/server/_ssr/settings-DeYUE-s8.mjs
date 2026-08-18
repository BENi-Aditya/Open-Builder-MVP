import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { s as supabase } from "./client-CZxeSKt5.mjs";
import { u as useAuth } from "./router-CUPGUMYq.mjs";
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
import "../_libs/lucide-react.mjs";
const STATUSES = ["not_looking", "open_to_collab", "seeking_cofounder", "seeking_designer", "seeking_developer", "available_for_hackathons"];
function SettingsPage() {
  const {
    user,
    profile,
    refreshProfile
  } = useAuth();
  const [form, setForm] = reactExports.useState({});
  const [avatarFile, setAvatarFile] = reactExports.useState(null);
  const [bannerFile, setBannerFile] = reactExports.useState(null);
  const [saving, setSaving] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({
      data
    }) => setForm(data ?? {}));
  }, [user?.id]);
  if (!user) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-10 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/auth", className: "brutal-btn", children: "Sign in" }) });
  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let avatar_url = form.avatar_url;
      let banner_url = form.banner_url;
      if (avatarFile) avatar_url = await uploadMedia(avatarFile, user.id, "avatars");
      if (bannerFile) banner_url = await uploadMedia(bannerFile, user.id, "banners");
      const skills = typeof form.skills === "string" ? form.skills.split(",").map((s) => s.trim()).filter(Boolean) : form.skills;
      const tech_stack = typeof form.tech_stack === "string" ? form.tech_stack.split(",").map((s) => s.trim()).filter(Boolean) : form.tech_stack;
      const {
        error
      } = await supabase.from("profiles").update({
        display_name: form.display_name,
        bio: form.bio,
        location: form.location,
        collab_status: form.collab_status,
        currently_building: form.currently_building,
        currently_learning: form.currently_learning,
        skills,
        tech_stack,
        avatar_url,
        banner_url
      }).eq("id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success("Saved");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mx-auto p-6 md:p-10 pb-24", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display font-black text-4xl mb-6", children: "Settings" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: save, className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(F, { label: "Display name", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: form.display_name || "", onChange: (e) => setForm({
        ...form,
        display_name: e.target.value
      }), className: "brutal-input" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(F, { label: "Bio", children: /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { value: form.bio || "", onChange: (e) => setForm({
        ...form,
        bio: e.target.value
      }), className: "brutal-input min-h-[100px]" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(F, { label: "Location", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: form.location || "", onChange: (e) => setForm({
        ...form,
        location: e.target.value
      }), className: "brutal-input" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(F, { label: "Collab status", children: /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: form.collab_status || "not_looking", onChange: (e) => setForm({
        ...form,
        collab_status: e.target.value
      }), className: "brutal-input", children: STATUSES.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: s, children: s.replace(/_/g, " ") }, s)) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(F, { label: "Currently building", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: form.currently_building || "", onChange: (e) => setForm({
        ...form,
        currently_building: e.target.value
      }), className: "brutal-input" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(F, { label: "Currently learning", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: form.currently_learning || "", onChange: (e) => setForm({
        ...form,
        currently_learning: e.target.value
      }), className: "brutal-input" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(F, { label: "Skills (comma separated)", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: Array.isArray(form.skills) ? form.skills.join(", ") : form.skills || "", onChange: (e) => setForm({
        ...form,
        skills: e.target.value
      }), className: "brutal-input" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(F, { label: "Tech stack (comma separated)", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: Array.isArray(form.tech_stack) ? form.tech_stack.join(", ") : form.tech_stack || "", onChange: (e) => setForm({
        ...form,
        tech_stack: e.target.value
      }), className: "brutal-input" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(F, { label: "Avatar", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "file", accept: "image/*", onChange: (e) => setAvatarFile(e.target.files?.[0] ?? null), className: "brutal-input" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(F, { label: "Banner (Recommended: 1200x400)", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "file", accept: "image/*", onChange: (e) => setBannerFile(e.target.files?.[0] ?? null), className: "brutal-input" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-mono text-muted-foreground mt-1", children: "// Banners are automatically muted to fit the theme" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { disabled: saving, className: "brutal-btn w-full justify-center", children: saving ? "Saving…" : "Save" })
    ] })
  ] });
}
function F({
  label,
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-1", children: label }),
    children
  ] });
}
export {
  SettingsPage as component
};
