import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { ProjectCard, type FeedProject } from "@/components/ProjectCard";

export const Route = createFileRoute("/saved")({ component: SavedPage });

function SavedPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<FeedProject[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("saves").select("project:projects(id, title, slug, tagline, cover_url, category, tech_stack, like_count, comment_count, github_url, demo_url, created_at, owner:profiles!projects_owner_id_fkey(id, username, display_name, avatar_url))").eq("user_id", user.id).order("created_at", { ascending: false });
      setItems(((data ?? []).map((r: any) => r.project).filter(Boolean)) as FeedProject[]);
    })();
  }, [user?.id]);

  if (!user) return <div className="p-10 text-center"><Link to="/auth" className="brutal-btn">Sign in</Link></div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 pb-24">
      <h1 className="font-display font-black text-4xl mb-6">Saved</h1>
      {items.length === 0 ? <p className="text-muted-foreground">Nothing saved yet.</p> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{items.map((p, i) => <ProjectCard key={p.id} project={p} accentSeed={i} />)}</div>
      )}
    </div>
  );
}
