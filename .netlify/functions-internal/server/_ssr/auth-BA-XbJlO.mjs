import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate } from "../_libs/tanstack__react-router.mjs";
import { s as supabase } from "./client-CZxeSKt5.mjs";
import { u as useAuth } from "./router-vnISQ9uA.mjs";
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
function AuthPage() {
  const {
    user
  } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = reactExports.useState("signin");
  const [email, setEmail] = reactExports.useState("");
  const [password, setPassword] = reactExports.useState("");
  const [username, setUsername] = reactExports.useState("");
  const [loading, setLoading] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (user) nav({
      to: "/"
    });
  }, [user, nav]);
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const {
          error
        } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              username,
              display_name: username
            }
          }
        });
        if (error) throw error;
        toast.success("Welcome aboard. Logging you in…");
      } else {
        const {
          error
        } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };
  const google = async () => {
    try {
      const {
        error
      } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err) {
      toast.error("Google sign-in failed. Please check your connection.");
      console.error(err);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen grid place-items-center p-4 bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "brutal-card p-6 md:p-8 w-full max-w-md bg-card", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center mb-6 flex flex-col items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: "/logo.webp", alt: "OPENBUILDER", className: "w-16 h-16 border-2 border-white object-cover", style: {
        boxShadow: "4px 4px 0 0 #fff"
      } }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-display font-black text-3xl", children: "OPENBUILDER" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-1", children: [
          "// ",
          mode === "signin" ? "log in to build" : "create your builder identity"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: google, className: "brutal-btn w-full justify-center mb-4 flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "w-4 h-4", viewBox: "0 0 24 24", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z", fill: "currentColor" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z", fill: "currentColor" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z", fill: "currentColor" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 1.16-4.53z", fill: "currentColor" })
      ] }),
      "Continue with Google"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 my-4 text-[10px] font-mono uppercase text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 h-px bg-white/10" }),
      " or email",
      " ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 h-px bg-white/10" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, className: "space-y-3", children: [
      mode === "signup" && /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: username, onChange: (e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")), required: true, minLength: 3, maxLength: 24, placeholder: "username", className: "brutal-input" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: email, onChange: (e) => setEmail(e.target.value), required: true, type: "email", placeholder: "email", className: "brutal-input" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: password, onChange: (e) => setPassword(e.target.value), required: true, type: "password", minLength: 6, placeholder: "password", className: "brutal-input" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { disabled: loading, className: "brutal-btn w-full justify-center", children: loading ? "…" : mode === "signin" ? "Sign in" : "Create account" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setMode(mode === "signin" ? "signup" : "signin"), className: "mt-4 text-xs font-mono text-muted-foreground hover:text-primary w-full text-center", children: mode === "signin" ? "Need an account? Sign up →" : "Already have one? Sign in →" })
  ] }) });
}
export {
  AuthPage as component
};
