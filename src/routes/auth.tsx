import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) nav({ to: "/" });
  }, [user, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { username, display_name: username },
          },
        });
        if (error) throw error;
        toast.success("Welcome aboard. Logging you in…");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    try {
      const res = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if ("error" in res && res.error) {
        toast.error(String(res.error));
      }
    } catch (err) {
      toast.error("Google sign-in failed. Please check your connection.");
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-4 bg-background">
      <div className="brutal-card p-6 md:p-8 w-full max-w-md bg-card">
        <div className="text-center mb-6 flex flex-col items-center gap-3">
          <img
            src="/logo.webp"
            alt="OPENBUILDER"
            className="w-16 h-16 border-2 border-white object-cover"
            style={{ boxShadow: "4px 4px 0 0 #fff" }}
          />
          <div>
            <div className="font-display font-black text-3xl">OPENBUILDER</div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-1">
              // {mode === "signin" ? "log in to build" : "create your builder identity"}
            </div>
          </div>
        </div>

        <button
          onClick={google}
          className="brutal-btn w-full justify-center mb-4 flex items-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="currentColor"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="currentColor"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              fill="currentColor"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 1.16-4.53z"
              fill="currentColor"
            />
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 my-4 text-[10px] font-mono uppercase text-muted-foreground">
          <div className="flex-1 h-px bg-white/10" /> or email{" "}
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <input
              value={username}
              onChange={(e) =>
                setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
              }
              required
              minLength={3}
              maxLength={24}
              placeholder="username"
              className="brutal-input"
            />
          )}
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            type="email"
            placeholder="email"
            className="brutal-input"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            type="password"
            minLength={6}
            placeholder="password"
            className="brutal-input"
          />
          <button disabled={loading} className="brutal-btn w-full justify-center">
            {loading ? "…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 text-xs font-mono text-muted-foreground hover:text-primary w-full text-center"
        >
          {mode === "signin" ? "Need an account? Sign up →" : "Already have one? Sign in →"}
        </button>
      </div>
    </div>
  );
}
