import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { uploadMedia } from "@/lib/upload";
import { toast } from "sonner";
import { Rocket, Youtube, Github, Globe, Image as ImageIcon, Sparkles } from "lucide-react";

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
  const [youtube, setYoutube] = useState("");
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
      const isYoutubeUrl = (url: string) => /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(url.trim());
      if (youtube.trim() && !isYoutubeUrl(youtube)) {
        throw new Error("Please enter a valid YouTube link");
      }
      const { data, error } = await supabase.from("projects").insert({
        owner_id: user.id, title, slug, tagline, description, tech_stack, category,
        github_url: github || null, demo_url: demo || null, youtube_url: youtube || null, cover_url,
      }).select("id").single();
      if (error) throw error;
      toast.success("Project shipped 🚀");
      nav({ to: "/p/$id", params: { id: data.id } });
    } catch (err) { toast.error((err as Error).message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10 pb-24">
      <header className="mb-6 brutal-card-flat p-5 md:p-6 relative overflow-hidden">
        <div className="grid-bg absolute inset-0 opacity-30" />
        <div className="relative">
          <span className="pill text-primary">// ship a new project</span>
          <h1 className="font-display font-black text-4xl mt-2">Launch your project like it matters.</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">A good project post gets discovered, saved, and followed. Fill this once, then keep posting progress logs linked to this project.</p>
        </div>
      </header>
      <form onSubmit={submit} className="space-y-4">
        <section className="brutal-card-flat p-4 md:p-5 space-y-4">
          <SectionTitle icon={<Sparkles className="h-4 w-4" />} title="Core details" />
          <Field label="Project title">
            <input required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} className="brutal-input" placeholder="ex: VibeCode" />
          </Field>
          <Field label="One-line tagline">
            <input maxLength={200} value={tagline} onChange={(e) => setTagline(e.target.value)} className="brutal-input" placeholder="what does it do in one sentence?" />
          </Field>
          <Field label="Description / README (markdown)">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="brutal-input min-h-[200px] resize-y" placeholder="# What it is\n\nExplain the problem, your solution, and what to try." />
          </Field>
        </section>

        <section className="brutal-card-flat p-4 md:p-5 space-y-4">
          <SectionTitle icon={<Rocket className="h-4 w-4" />} title="Discoverability" />
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Tech stack (comma separated)">
              <input value={techText} onChange={(e) => setTechText(e.target.value)} className="brutal-input" placeholder="react, supabase, python" />
            </Field>
            <Field label="Category">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="brutal-input">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>
        </section>

        <section className="brutal-card-flat p-4 md:p-5 space-y-4">
          <SectionTitle icon={<Globe className="h-4 w-4" />} title="Links" />
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="GitHub URL" icon={<Github className="h-3.5 w-3.5" />}>
              <input value={github} onChange={(e) => setGithub(e.target.value)} className="brutal-input" placeholder="https://github.com/..." />
            </Field>
            <Field label="Live demo URL" icon={<Globe className="h-3.5 w-3.5" />}>
              <input value={demo} onChange={(e) => setDemo(e.target.value)} className="brutal-input" placeholder="https://..." />
            </Field>
            <Field label="YouTube demo URL" icon={<Youtube className="h-3.5 w-3.5" />}>
              <input value={youtube} onChange={(e) => setYoutube(e.target.value)} className="brutal-input" placeholder="https://youtube.com/watch?v=..." />
            </Field>
          </div>
        </section>

        <section className="brutal-card-flat p-4 md:p-5 space-y-4">
          <SectionTitle icon={<ImageIcon className="h-4 w-4" />} title="Cover image" />
          <Field label="Upload cover image">
            <input type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0] ?? null)} className="brutal-input" />
          </Field>
        </section>

        <div className="sticky bottom-[calc(5.8rem+env(safe-area-inset-bottom))] md:bottom-4 z-10">
          <button disabled={submitting} className="brutal-btn w-full justify-center text-base py-3">
            <Rocket className="h-4 w-4" /> {submitting ? "Shipping..." : "Ship project"}
          </button>
        </div>
      </form>
    </div>
  );
}

function SectionTitle({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 font-display text-lg font-black uppercase tracking-tight">
      {icon}
      {title}
    </h2>
  );
}

function Field({ label, children, icon }: { label: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{icon}{label}</span>
      {children}
    </label>
  );
}
