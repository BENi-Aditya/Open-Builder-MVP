import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Eye, Edit2, ClipboardList, Ban, Rocket, Users, ShieldCheck, Trash2, Loader2, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useHuddleRole } from "@/hooks/use-huddle-role";
import { Avatar } from "@/components/AppShell";
import { HuddleShell, HuddleNav } from "@/components/huddle/HuddleShell";
import { EventStatusBadge } from "@/components/huddle/EventStatusBadge";
import { EmptyState, ErrorState, OrganizerOnly } from "@/components/huddle/States";
import { useNow } from "@/components/huddle/useNow";
import { computeEventState, EVENT_CARD_SELECT, formatEventDate, formatEventTimeRange, type AppRole, type HuddleEvent, type MiniProfile } from "@/lib/huddle";

export const Route = createFileRoute("/huddle/manage")({
  component: ManagePage,
  head: () => ({ meta: [{ title: "Manage huddles — OpenBuilder × Huddle" }] }),
});

type Tab = "all" | "draft" | "published" | "upcoming" | "completed" | "cancelled";
const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "draft", label: "Drafts" },
  { id: "published", label: "Published" },
  { id: "upcoming", label: "Upcoming" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

function ManagePage() {
  const { user, loading: authLoading } = useAuth();
  const { isOrganizer, isAdmin, loading: roleLoading } = useHuddleRole();
  const now = useNow(60_000);
  const [events, setEvents] = useState<HuddleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    let q = supabase.from("events").select(EVENT_CARD_SELECT).order("starts_at", { ascending: false });
    if (!isAdmin) q = q.eq("organizer_id", user.id);
    const { data, error } = await q;
    if (error) setError(error.message);
    setEvents((data ?? []) as unknown as HuddleEvent[]);
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading || roleLoading) return;
    if (isOrganizer) load();
    else setLoading(false);
  }, [user?.id, isOrganizer, isAdmin, authLoading, roleLoading]);

  const filtered = useMemo(() => {
    const t = now ?? new Date();
    return events.filter((e) => {
      const st = computeEventState(e, t);
      switch (tab) {
        case "draft": return e.status === "draft";
        case "published": return e.status === "published";
        case "upcoming": return e.status === "published" && st !== "completed";
        case "completed": return st === "completed";
        case "cancelled": return e.status === "cancelled";
        default: return true;
      }
    });
  }, [events, tab, now]);

  const counts = useMemo(() => {
    const t = now ?? new Date();
    const c: Record<Tab, number> = { all: events.length, draft: 0, published: 0, upcoming: 0, completed: 0, cancelled: 0 };
    for (const e of events) {
      const st = computeEventState(e, t);
      if (e.status === "draft") c.draft++;
      if (e.status === "published") c.published++;
      if (e.status === "published" && st !== "completed") c.upcoming++;
      if (st === "completed") c.completed++;
      if (e.status === "cancelled") c.cancelled++;
    }
    return c;
  }, [events, now]);

  const setStatus = async (e: HuddleEvent, status: "published" | "cancelled" | "draft") => {
    if (status === "cancelled" && !confirm(`Cancel "${e.title}"? Registered builders will be notified.`)) return;
    setBusy(e.id);
    const { error } = await supabase.from("events").update({ status }).eq("id", e.id);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(status === "published" ? "Published" : status === "cancelled" ? "Cancelled" : "Moved to draft");
    load();
  };

  const remove = async (e: HuddleEvent) => {
    if (!confirm(`Delete draft "${e.title}"? This cannot be undone.`)) return;
    setBusy(e.id);
    const { error } = await supabase.from("events").delete().eq("id", e.id);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Draft deleted");
    load();
  };

  const totalRegs = events.reduce((n, e) => n + e.registration_count, 0);

  return (
    <HuddleShell>
      <div className="mx-auto max-w-6xl p-4 pb-24 md:p-8">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="pill text-primary">// organizer console</span>
            <h1 className="mt-2 font-display text-4xl font-black uppercase leading-none tracking-tight">Events</h1>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {events.length} event{events.length === 1 ? "" : "s"} · {totalRegs} total registrations{isAdmin ? " · admin view (all organizers)" : ""}
            </p>
          </div>
        </header>

        <HuddleNav />

        {authLoading || roleLoading ? (
          <div className="mt-6 space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse bg-white/5" />)}</div>
        ) : !user ? (
          <EmptyState title="Sign in first." sub="The organizer console is for Huddle organizers." cta={<Link to="/auth" className="brutal-btn text-xs">Sign in</Link>} />
        ) : !isOrganizer ? (
          <div className="mt-6"><OrganizerOnly /></div>
        ) : (
          <>
            <div className="mt-6 flex flex-wrap gap-2">
              {TABS.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)} className={`pill ${tab === t.id ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {t.label} <span className="ml-1 opacity-70">{counts[t.id]}</span>
                </button>
              ))}
            </div>

            <section className="mt-4">
              {error ? (
                <ErrorState message={error} onRetry={load} />
              ) : loading ? (
                <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse bg-white/5" />)}</div>
              ) : filtered.length === 0 ? (
                <EmptyState
                  title={events.length === 0 ? "No events yet." : `No ${tab} events.`}
                  sub={events.length === 0 ? "Create your first huddle — a draft is fine, publish when it's ready." : "Switch tabs or create a new one."}
                  cta={<Link to="/huddle/create" className="brutal-btn text-xs"><Plus className="h-3.5 w-3.5" /> Create event</Link>}
                />
              ) : (
                <div className="space-y-3">
                  {filtered.map((e) => {
                    const st = computeEventState(e, now ?? new Date());
                    const pct = e.capacity ? Math.min(100, Math.round((e.registration_count / e.capacity) * 100)) : null;
                    return (
                      <article key={e.id} className="brutal-card-flat grid gap-4 p-3 hover:border-white/40 md:grid-cols-[112px_1fr_auto] md:p-4">
                        <Link to="/huddle/$eventId" params={{ eventId: e.id }} className="relative hidden h-20 overflow-hidden border-2 border-white/20 bg-ink md:block">
                          {e.cover_image_url ? <img src={e.cover_image_url} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center font-display text-3xl font-black text-white/10">{e.title[0]}</div>}
                        </Link>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <EventStatusBadge event={e} />
                            {isAdmin && e.organizer && (
                              <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground"><Avatar profile={e.organizer} size={16} /> @{e.organizer.username}</span>
                            )}
                          </div>
                          <Link to="/huddle/$eventId" params={{ eventId: e.id }} className="mt-1 block font-display text-xl font-black uppercase leading-tight tracking-tight hover:text-primary">{e.title}</Link>
                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3 text-primary" /> {formatEventDate(e.starts_at, e.timezone)} · {formatEventTimeRange(e.starts_at, e.ends_at, e.timezone)}</span>
                            <span className="flex items-center gap-1"><Users className="h-3 w-3 text-primary" /> {e.registration_count}{e.capacity ? ` / ${e.capacity}` : ""} registered</span>
                          </div>
                          {pct !== null && (
                            <div className="mt-2 h-1.5 w-full max-w-xs border border-white/20 bg-ink"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 md:flex-col md:items-stretch">
                          <Link to="/huddle/$eventId" params={{ eventId: e.id }} className="brutal-btn brutal-btn-ghost px-3 py-1.5 text-[10px]"><Eye className="h-3 w-3" /> View</Link>
                          <Link to="/huddle/$eventId/edit" params={{ eventId: e.id }} className="brutal-btn brutal-btn-ghost px-3 py-1.5 text-[10px]"><Edit2 className="h-3 w-3" /> Edit</Link>
                          <Link to="/huddle/$eventId/attendees" params={{ eventId: e.id }} className="brutal-btn brutal-btn-ghost px-3 py-1.5 text-[10px]"><ClipboardList className="h-3 w-3" /> Attendees</Link>
                          {e.status === "draft" && (
                            <>
                              <button disabled={busy === e.id} onClick={() => setStatus(e, "published")} className="brutal-btn px-3 py-1.5 text-[10px]">{busy === e.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Rocket className="h-3 w-3" />} Publish</button>
                              <button disabled={busy === e.id} onClick={() => remove(e)} className="brutal-btn brutal-btn-ghost px-3 py-1.5 text-[10px] text-destructive"><Trash2 className="h-3 w-3" /> Delete</button>
                            </>
                          )}
                          {e.status === "published" && st !== "completed" && (
                            <button disabled={busy === e.id} onClick={() => setStatus(e, "cancelled")} className="brutal-btn brutal-btn-danger px-3 py-1.5 text-[10px]">{busy === e.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Ban className="h-3 w-3" />} Cancel</button>
                          )}
                          {e.status === "cancelled" && (
                            <button disabled={busy === e.id} onClick={() => setStatus(e, "published")} className="brutal-btn px-3 py-1.5 text-[10px]"><Rocket className="h-3 w-3" /> Re-publish</button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {isAdmin && <RolesPanel adminId={user.id} />}
          </>
        )}
      </div>
    </HuddleShell>
  );
}

/** Huddle admins grant / revoke organizer access. Enforced by RLS on user_roles. */
function RolesPanel({ adminId }: { adminId: string }) {
  const [rows, setRows] = useState<{ user_id: string; role: AppRole; user: MiniProfile }[]>([]);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<AppRole>("huddle_organizer");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("user_roles")
      .select("user_id, role, user:profiles!user_roles_user_id_fkey(id, username, display_name, avatar_url)")
      .order("created_at", { ascending: false });
    setRows((data ?? []) as unknown as typeof rows);
  };
  useEffect(() => { load(); }, []);

  const grant = async (e: React.FormEvent) => {
    e.preventDefault();
    const uname = username.trim().replace(/^@/, "");
    if (!uname) return;
    setBusy(true);
    const { data: p } = await supabase.from("profiles").select("id").eq("username", uname).maybeSingle();
    if (!p) { setBusy(false); return toast.error(`No builder named @${uname}`); }
    const { error } = await supabase.from("user_roles").insert({ user_id: p.id, role, granted_by: adminId });
    setBusy(false);
    if (error) return toast.error(error.code === "23505" ? "Already has that role" : error.message);
    toast.success(`@${uname} is now ${role.replace(/_/g, " ")}`);
    setUsername("");
    load();
  };

  const revoke = async (r: (typeof rows)[number]) => {
    if (!confirm(`Remove ${r.role.replace(/_/g, " ")} from @${r.user.username}?`)) return;
    const { error } = await supabase.from("user_roles").delete().eq("user_id", r.user_id).eq("role", r.role);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <section className="brutal-card-flat mt-10 border-primary/40 p-4 md:p-6">
      <h2 className="flex items-center gap-2 font-display text-xl font-black uppercase tracking-tight"><ShieldCheck className="h-5 w-5 text-primary" /> Roles & permissions</h2>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Organizers can create and manage their own events. Admins can manage everything.</p>
      <form onSubmit={grant} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="@username" className="brutal-input flex-1 py-2 text-xs" />
        <select value={role} onChange={(e) => setRole(e.target.value as AppRole)} className="brutal-input py-2 text-xs sm:w-52">
          <option value="huddle_organizer">Huddle organizer</option>
          <option value="huddle_admin">Huddle admin</option>
          <option value="openbuilder_admin">OpenBuilder admin</option>
        </select>
        <button disabled={busy} className="brutal-btn px-4 py-2 text-xs">{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Grant</button>
      </form>
      <ul className="mt-4 divide-y-2 divide-white/10">
        {rows.map((r) => (
          <li key={`${r.user_id}-${r.role}`} className="flex items-center gap-3 py-2">
            <Link to="/u/$username" params={{ username: r.user.username }}><Avatar profile={r.user} size={30} /></Link>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold">{r.user.display_name || r.user.username}</div>
              <div className="font-mono text-[10px] text-muted-foreground">@{r.user.username}</div>
            </div>
            <span className="pill text-primary">{r.role.replace(/_/g, " ")}</span>
            {r.user_id !== adminId && (
              <button onClick={() => revoke(r)} className="border-2 border-transparent p-1 text-muted-foreground hover:border-destructive hover:text-destructive" aria-label="Revoke"><Trash2 className="h-3.5 w-3.5" /></button>
            )}
          </li>
        ))}
        {rows.length === 0 && <li className="py-3 font-mono text-[10px] uppercase text-muted-foreground">No roles granted yet.</li>}
      </ul>
    </section>
  );
}
