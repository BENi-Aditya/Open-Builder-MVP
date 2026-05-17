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

  useEffect(() => { if (user) nav({ to: "/" }); }, [user, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin, data: { username, display_name: username } },
        });
        if (error) throw error;
        toast.success("Welcome aboard. Logging you in…");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally { setLoading(false); }
  };

  const google = async () => {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if ("error" in res && res.error) toast.error(String(res.error));
  };

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="brutal-card p-6 md:p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="font-display font-black text-3xl">OPENBUILDER</div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-1">// {mode === "signin" ? "log in to build" : "create your builder identity"}</div>
        </div>

        <button onClick={google} className="brutal-btn w-full justify-center mb-4">Continue with Google</button>

        <div className="flex items-center gap-3 my-4 text-[10px] font-mono uppercase text-muted-foreground">
          <div className="flex-1 h-px bg-white/10" /> or email <div className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} required minLength={3} maxLength={24} placeholder="username" className="brutal-input" />
          )}
          <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" placeholder="email" className="brutal-input" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} required type="password" minLength={6} placeholder="password" className="brutal-input" />
          <button disabled={loading} className="brutal-btn w-full justify-center">{loading ? "…" : mode === "signin" ? "Sign in" : "Create account"}</button>
        </form>

        <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="mt-4 text-xs font-mono text-muted-foreground hover:text-primary w-full text-center">
          {mode === "signin" ? "Need an account? Sign up →" : "Already have one? Sign in →"}
        </button>
      </div>
    </div>
  );
}
