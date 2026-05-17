import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProjectCard, type FeedProject } from "@/components/ProjectCard";
import { Avatar } from "@/components/AppShell";
import { FollowButton } from "@/components/FollowButton";

export const Route = createFileRoute("/explore")({
  component: Explore,
  validateSearch: (s: Record<string, unknown>) => ({ q: (s.q as string) || "" }),
});

function Explore() {
  const { q } = Route.useSearch();
  const [query, setQuery] = useState(q);
  const [projects, setProjects] = useState<FeedProject[]>([]);
  const [builders, setBuilders] = useState<any[]>([]);
  const [cat, setCat] = useState<string | null>(null);
  const CATS = ["AI", "Robotics", "Web", "Mobile", "Hardware", "Game", "DevTool"];

  useEffect(() => {
    (async () => {
      const proj = supabase.from("projects").select("id, title, slug, tagline, cover_url, category, tech_stack, like_count, comment_count, github_url, demo_url, created_at, owner:profiles!projects_owner_id_fkey(id, username, display_name, avatar_url)").eq("visibility", "public").order("like_count", { ascending: false }).limit(30);
      if (cat) proj.eq("category", cat);
      if (query) proj.or(`title.ilike.%${query}%,tagline.ilike.%${query}%`);
      const { data: pr } = await proj;
      setProjects((pr ?? []) as unknown as FeedProject[]);

      const blds = supabase.from("profiles").select("*").limit(12);
      if (query) blds.or(`username.ilike.%${query}%,display_name.ilike.%${query}%,bio.ilike.%${query}%`);
      const { data: bl } = await blds;
      setBuilders(bl ?? []);
    })();
  }, [query, cat]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 pb-24">
      <h1 className="font-display font-black text-4xl mb-6">Explore</h1>

      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="search projects, builders…" className="brutal-input mb-4" />

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setCat(null)} className={`pill ${cat === null ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground"}`}>All</button>
        {CATS.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`pill ${cat === c ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground"}`}>{c}</button>
        ))}
      </div>

      <section className="mb-10">
        <h2 className="font-display font-bold text-2xl mb-4">Projects</h2>
        {projects.length === 0 ? <p className="text-muted-foreground">Nothing matches.</p> : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p, i) => <ProjectCard key={p.id} project={p} accentSeed={i} />)}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display font-bold text-2xl mb-4">Builders</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {builders.map((b) => (
            <div key={b.id} className="brutal-card-flat p-4 flex items-center gap-3">
              <Link to="/u/$username" params={{ username: b.username }}><Avatar profile={b} size={44} /></Link>
              <div className="flex-1 min-w-0">
                <Link to="/u/$username" params={{ username: b.username }} className="font-bold text-sm hover:text-primary">{b.display_name || b.username}</Link>
                <div className="text-xs font-mono text-muted-foreground truncate">@{b.username}</div>
              </div>
              <FollowButton targetId={b.id} size="sm" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
