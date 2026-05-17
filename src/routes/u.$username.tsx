import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Avatar } from "@/components/AppShell";
import { FollowButton } from "@/components/FollowButton";
import { ProjectCard, type FeedProject } from "@/components/ProjectCard";
import { BuildLogCard, type BuildLog } from "@/components/BuildLogCard";
import { toast } from "sonner";
import { Edit2, MapPin } from "lucide-react";

export const Route = createFileRoute("/u/$username")({ component: ProfilePage });

function ProfilePage() {
  const { username } = Route.useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any | null>(null);
  const [projects, setProjects] = useState<FeedProject[]>([]);
  const [logs, setLogs] = useState<BuildLog[]>([]);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [tab, setTab] = useState<"projects" | "logs">("projects");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: p } = await supabase.from("profiles").select("*").eq("username", username).maybeSingle();
      if (!p) { setLoading(false); return; }
      setProfile(p);
      const [{ data: pr }, { data: lg }, { count: fc }, { count: fgc }] = await Promise.all([
        supabase.from("projects").select("id, title, slug, tagline, cover_url, category, tech_stack, like_count, comment_count, github_url, demo_url, created_at, owner:profiles!projects_owner_id_fkey(id, username, display_name, avatar_url)").eq("owner_id", p.id).eq("visibility", "public").order("created_at", { ascending: false }),
        supabase.from("build_logs").select("id, body, image_url, created_at, project_id, project:projects(id, title), user:profiles!build_logs_user_id_fkey(id, username, display_name, avatar_url)").eq("user_id", p.id).order("created_at", { ascending: false }).limit(30),
        supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", p.id),
        supabase.from("follows").select("following_id", { count: "exact", head: true }).eq("follower_id", p.id),
      ]);
      setProjects((pr ?? []) as unknown as FeedProject[]);
      setLogs((lg ?? []) as unknown as BuildLog[]);
      setCounts({ followers: fc ?? 0, following: fgc ?? 0 });
      setLoading(false);
    })();
  }, [username]);

  if (loading) return <div className="p-10 text-center text-muted-foreground font-mono">loading...</div>;
  if (!profile) return <div className="p-10 text-center"><h1 className="font-display text-3xl">Builder not found</h1></div>;

  const isMe = user?.id === profile.id;

  return (
    <div className="pb-24">
      {/* Banner */}
      <div className="h-48 md:h-64 relative grid-bg" style={{ background: profile.banner_url ? undefined : "linear-gradient(135deg, var(--grape), var(--tangerine))" }}>
        {profile.banner_url && <img src={profile.banner_url} alt="" className="w-full h-full object-cover" />}
      </div>
      <div className="max-w-5xl mx-auto px-4 md:px-8">
        <div className="flex items-end gap-4 -mt-14 flex-wrap">
          <div className="border-2 border-white" style={{ boxShadow: "6px 6px 0 0 var(--primary)" }}>
            <Avatar profile={profile} size={112} />
          </div>
          <div className="flex-1 min-w-0 pb-2">
            <h1 className="font-display font-black text-3xl md:text-4xl leading-none">{profile.display_name || profile.username}</h1>
            <div className="text-sm font-mono text-muted-foreground">@{profile.username}</div>
          </div>
          <div className="pb-2 flex gap-2">
            {isMe ? (
              <Link to="/settings" className="brutal-btn brutal-btn-ghost text-xs"><Edit2 className="w-3 h-3" /> Edit profile</Link>
            ) : (
              <FollowButton targetId={profile.id} />
            )}
          </div>
        </div>

        {profile.bio && <p className="mt-4 max-w-2xl">{profile.bio}</p>}
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-mono text-muted-foreground">
          {profile.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {profile.location}</span>}
          {profile.collab_status && profile.collab_status !== "not_looking" && <span className="pill text-[var(--tangerine)]">{profile.collab_status.replace(/_/g, " ")}</span>}
          {profile.currently_building && <span>building: <b className="text-foreground">{profile.currently_building}</b></span>}
        </div>

        <div className="flex gap-6 mt-4 font-mono text-sm">
          <span><b className="text-primary">{projects.length}</b> projects</span>
          <span><b className="text-primary">{counts.followers}</b> followers</span>
          <span><b className="text-primary">{counts.following}</b> following</span>
        </div>

        {profile.skills && profile.skills.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1">{profile.skills.map((s: string) => <span key={s} className="pill text-muted-foreground">{s}</span>)}</div>
        )}

        <div className="flex gap-1 mt-8 mb-4 border-b-2 border-white/10">
          {(["projects", "logs"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 font-bold uppercase text-xs tracking-wider border-b-4 ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>{t}</button>
          ))}
        </div>

        {tab === "projects" ? (
          projects.length === 0 ? <p className="text-muted-foreground text-center py-12">No projects yet.</p> :
          <div className="grid md:grid-cols-2 gap-4">{projects.map((p, i) => <ProjectCard key={p.id} project={p} accentSeed={i} />)}</div>
        ) : (
          logs.length === 0 ? <p className="text-muted-foreground text-center py-12">No build logs yet.</p> :
          <div className="space-y-3">{logs.map((l) => <BuildLogCard key={l.id} log={l} />)}</div>
        )}
      </div>
    </div>
  );
}
