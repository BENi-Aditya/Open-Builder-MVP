import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { uploadMedia } from "@/lib/upload";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

const STATUSES = ["not_looking", "open_to_collab", "seeking_cofounder", "seeking_designer", "seeking_developer", "available_for_hackathons"];

function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [form, setForm] = useState<any>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => setForm(data ?? {}));
  }, [user?.id]);

  if (!user) return <div className="p-10 text-center"><Link to="/auth" className="brutal-btn">Sign in</Link></div>;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let avatar_url = form.avatar_url;
      let banner_url = form.banner_url;
      if (avatarFile) avatar_url = await uploadMedia(avatarFile, user.id, "avatars");
      if (bannerFile) banner_url = await uploadMedia(bannerFile, user.id, "banners");
      const skills = typeof form.skills === "string" ? form.skills.split(",").map((s: string) => s.trim()).filter(Boolean) : form.skills;
      const tech_stack = typeof form.tech_stack === "string" ? form.tech_stack.split(",").map((s: string) => s.trim()).filter(Boolean) : form.tech_stack;
      const { error } = await supabase.from("profiles").update({
        display_name: form.display_name, bio: form.bio, location: form.location,
        collab_status: form.collab_status, currently_building: form.currently_building, currently_learning: form.currently_learning,
        skills, tech_stack, avatar_url, banner_url,
      }).eq("id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success("Saved");
    } catch (err) { toast.error((err as Error).message); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-10 pb-24">
      <h1 className="font-display font-black text-4xl mb-6">Settings</h1>
      <form onSubmit={save} className="space-y-3">
        <F label="Display name"><input value={form.display_name || ""} onChange={(e) => setForm({ ...form, display_name: e.target.value })} className="brutal-input" /></F>
        <F label="Bio"><textarea value={form.bio || ""} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="brutal-input min-h-[100px]" /></F>
        <F label="Location"><input value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} className="brutal-input" /></F>
        <F label="Collab status">
          <select value={form.collab_status || "not_looking"} onChange={(e) => setForm({ ...form, collab_status: e.target.value })} className="brutal-input">
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
        </F>
        <F label="Currently building"><input value={form.currently_building || ""} onChange={(e) => setForm({ ...form, currently_building: e.target.value })} className="brutal-input" /></F>
        <F label="Currently learning"><input value={form.currently_learning || ""} onChange={(e) => setForm({ ...form, currently_learning: e.target.value })} className="brutal-input" /></F>
        <F label="Skills (comma separated)"><input value={Array.isArray(form.skills) ? form.skills.join(", ") : form.skills || ""} onChange={(e) => setForm({ ...form, skills: e.target.value })} className="brutal-input" /></F>
        <F label="Tech stack (comma separated)"><input value={Array.isArray(form.tech_stack) ? form.tech_stack.join(", ") : form.tech_stack || ""} onChange={(e) => setForm({ ...form, tech_stack: e.target.value })} className="brutal-input" /></F>
        <F label="Avatar"><input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)} className="brutal-input" /></F>
        <F label="Banner (Recommended: 1200x400)">
          <input type="file" accept="image/*" onChange={(e) => setBannerFile(e.target.files?.[0] ?? null)} className="brutal-input" />
          <p className="text-[10px] font-mono text-muted-foreground mt-1">// Banners are automatically muted to fit the theme</p>
        </F>
        <button disabled={saving} className="brutal-btn w-full justify-center">{saving ? "Saving…" : "Save"}</button>
      </form>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-1">{label}</span>{children}</label>;
}
