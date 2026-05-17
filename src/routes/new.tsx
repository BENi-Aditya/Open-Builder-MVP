import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { uploadMedia } from "@/lib/upload";
import { toast } from "sonner";

export const Route = createFileRoute("/new")({ component: NewProject });

const CATEGORIES = ["AI", "Robotics", "Web", "Mobile", "Hardware", "Game", "DevTool", "Bio", "Other"];

function NewProject() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [techText, setTechText] = useState("");
  const [category, setCategory] = useState("AI");
  const [github, setGithub] = useState("");
  const [demo, setDemo] = useState("");
  const [cover, setCover] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return (
      <div className="p-10 max-w-md mx-auto text-center">
        <h1 className="font-display text-2xl mb-4">Log in to ship</h1>
        <Link to="/auth" className="brutal-btn">Sign in</Link>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let cover_url: string | null = null;
      if (cover) cover_url = await uploadMedia(cover, user.id, "covers");
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || crypto.randomUUID().slice(0, 8);
      const tech_stack = techText.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 12);
      const { data, error } = await supabase.from("projects").insert({
        owner_id: user.id, title, slug, tagline, description, tech_stack, category,
        github_url: github || null, demo_url: demo || null, cover_url,
      }).select("id").single();
      if (error) throw error;
      toast.success("Project shipped 🚀");
      nav({ to: "/p/$id", params: { id: data.id } });
    } catch (err) { toast.error((err as Error).message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10 pb-24">
      <header className="mb-6">
        <span className="pill text-primary">// new project</span>
        <h1 className="font-display font-black text-4xl mt-2">Ship something insane.</h1>
      </header>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Title">
          <input required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} className="brutal-input" />
        </Field>
        <Field label="One-line tagline">
          <input maxLength={200} value={tagline} onChange={(e) => setTagline(e.target.value)} className="brutal-input" placeholder="what does it do?" />
        </Field>
        <Field label="Description / README (markdown)">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="brutal-input min-h-[200px] resize-y" placeholder="# What it is\n\n…" />
        </Field>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Tech stack (comma separated)">
            <input value={techText} onChange={(e) => setTechText(e.target.value)} className="brutal-input" placeholder="react, supabase, python" />
          </Field>
          <Field label="Category">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="brutal-input">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="GitHub URL"><input value={github} onChange={(e) => setGithub(e.target.value)} className="brutal-input" placeholder="https://github.com/…" /></Field>
          <Field label="Live demo URL"><input value={demo} onChange={(e) => setDemo(e.target.value)} className="brutal-input" placeholder="https://…" /></Field>
        </div>
        <Field label="Cover image">
          <input type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0] ?? null)} className="brutal-input" />
        </Field>
        <button disabled={submitting} className="brutal-btn w-full justify-center text-base py-3">{submitting ? "Shipping…" : "🚀 Ship project"}</button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-1">{label}</span>
      {children}
    </label>
  );
}
