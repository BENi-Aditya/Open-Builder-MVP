import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Download, Edit2, Eye, MessageSquare, Search, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useHuddleRole } from "@/hooks/use-huddle-role";
import { Avatar } from "@/components/AppShell";
import { MessageButton } from "@/components/MessageButton";
import { HuddleShell } from "@/components/huddle/HuddleShell";
import { EventStatusBadge } from "@/components/huddle/EventStatusBadge";
import { EmptyState, OrganizerOnly } from "@/components/huddle/States";
import { EVENT_CARD_SELECT, type Attendee, type HuddleEvent } from "@/lib/huddle";

export const Route = createFileRoute("/huddle/$eventId_/attendees")({
  component: AttendeesPage,
  head: () => ({ meta: [{ title: "Attendees — Huddle" }] }),
});

function AttendeesPage() {
  const { eventId } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useHuddleRole();
  const [event, setEvent] = useState<HuddleEvent | null>(null);
  const [rows, setRows] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [showCancelled, setShowCancelled] = useState(false);

  const canManage = !!user && !!event && (event.organizer_id === user.id || isAdmin);

  const load = async () => {
    setLoading(true);
    const { data: ev } = await supabase.from("events").select(EVENT_CARD_SELECT).eq("id", eventId).maybeSingle();
    setEvent((ev as unknown as HuddleEvent) ?? null);
    const { data, error } = await supabase
      .from("event_registrations")
      .select("id, user_id, registered_at, status, user:profiles!event_registrations_user_id_fkey(id, username, display_name, avatar_url)")
      .eq("event_id", eventId)
      .order("registered_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data ?? []) as unknown as Attendee[]);
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;
    load();
  }, [eventId, user?.id, authLoading]);

  useEffect(() => {
    const ch = supabase
      .channel(`huddle-attendees:${eventId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "event_registrations", filter: `event_id=eq.${eventId}` }, () => load())
      .subscribe();
    return () => { ch.unsubscribe(); };
  }, [eventId]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return rows.filter((r) => (showCancelled || r.status === "registered") && (!qq || r.user.username.toLowerCase().includes(qq) || (r.user.display_name ?? "").toLowerCase().includes(qq)));
  }, [rows, q, showCancelled]);

  const registered = rows.filter((r) => r.status === "registered").length;
  const cancelled = rows.length - registered;

  const exportCsv = () => {
    const lines = [["name", "username", "profile_url", "status", "registered_at"].join(",")];
    for (const r of filtered) {
      lines.push([
        JSON.stringify(r.user.display_name ?? ""), r.user.username, `${location.origin}/u/${r.user.username}`, r.status, r.registered_at,
      ].join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(event?.title ?? "huddle").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-attendees.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <HuddleShell>
      <div className="mx-auto max-w-4xl p-4 pb-24 md:p-8">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Link to="/huddle/manage" className="inline-flex items-center gap-1.5 font-mono text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-3 w-3" /> manage events
          </Link>
          {event && canManage && (
            <div className="ml-auto flex gap-2">
              <Link to="/huddle/$eventId" params={{ eventId }} className="brutal-btn brutal-btn-ghost px-3 py-1.5 text-[10px]"><Eye className="h-3 w-3" /> View</Link>
              <Link to="/huddle/$eventId/edit" params={{ eventId }} className="brutal-btn brutal-btn-ghost px-3 py-1.5 text-[10px]"><Edit2 className="h-3 w-3" /> Edit</Link>
              {event.chat_id && <Link to="/chat" search={{ id: event.chat_id }} className="brutal-btn px-3 py-1.5 text-[10px]"><MessageSquare className="h-3 w-3" /> Event chat</Link>}
            </div>
          )}
        </div>

        {authLoading || roleLoading || loading ? (
          <div className="space-y-3"><div className="h-24 animate-pulse bg-white/5" />{[0, 1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse bg-white/5" />)}</div>
        ) : !user ? (
          <EmptyState title="Sign in first." sub="Attendee management is for event organizers." cta={<Link to="/auth" className="brutal-btn text-xs">Sign in</Link>} />
        ) : !event ? (
          <EmptyState title="Huddle not found." sub="It may have been removed, or you don't have access." cta={<Link to="/huddle" className="brutal-btn text-xs">Back to huddles</Link>} />
        ) : !canManage ? (
          <OrganizerOnly />
        ) : (
          <>
            <header className="brutal-card-flat relative mb-5 overflow-hidden p-5 md:p-6">
              <div className="grid-bg absolute inset-0 opacity-30" />
              <div className="relative flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="pill text-primary">// attendees</span>
                  <h1 className="mt-2 font-display text-3xl font-black uppercase leading-none tracking-tight">{event.title}</h1>
                  <p className="mt-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    <Users className="h-3 w-3 text-primary" /> {registered} registered{event.capacity ? ` / ${event.capacity}` : ""}{cancelled > 0 ? ` · ${cancelled} cancelled` : ""}
                  </p>
                </div>
                <EventStatusBadge event={event} size="md" />
              </div>
            </header>

            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="search by name or @username" className="brutal-input py-2 pl-8 text-xs" />
              </div>
              <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <input type="checkbox" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} className="accent-[var(--primary)]" /> show cancelled
              </label>
              <button onClick={exportCsv} disabled={filtered.length === 0} className="brutal-btn brutal-btn-ghost px-3 py-2 text-[10px]"><Download className="h-3 w-3" /> Export CSV</button>
            </div>

            {filtered.length === 0 ? (
              <EmptyState title={rows.length === 0 ? "No registrations yet." : "No matches."} sub={rows.length === 0 ? "Share the event link — the room fills up faster than you think." : "Try a different search."} />
            ) : (
              <div className="brutal-card-flat overflow-hidden">
                <div className="hidden grid-cols-[1fr_140px_150px_110px] gap-3 border-b-2 border-white/15 bg-ink/50 px-4 py-2 font-mono text-[9px] uppercase tracking-widest text-muted-foreground md:grid">
                  <span>Builder</span><span>Status</span><span>Registered</span><span className="text-right">Actions</span>
                </div>
                <ul className="divide-y-2 divide-white/10">
                  {filtered.map((r) => (
                    <li key={r.id} className="grid gap-2 px-4 py-3 md:grid-cols-[1fr_140px_150px_110px] md:items-center md:gap-3">
                      <Link to="/u/$username" params={{ username: r.user.username }} className="flex min-w-0 items-center gap-3 hover:text-primary">
                        <Avatar profile={r.user} size={36} />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold">{r.user.display_name || r.user.username}</div>
                          <div className="truncate font-mono text-[10px] text-muted-foreground">@{r.user.username}</div>
                        </div>
                      </Link>
                      <div>
                        <span className={`pill ${r.status === "registered" ? "border-primary text-primary" : "text-muted-foreground"}`}>{r.status}</span>
                      </div>
                      <div className="font-mono text-[10px] uppercase text-muted-foreground" title={new Date(r.registered_at).toLocaleString()}>
                        {formatDistanceToNow(new Date(r.registered_at), { addSuffix: true })}
                      </div>
                      <div className="flex justify-start gap-1 md:justify-end">
                        <MessageButton targetId={r.user.id} size="sm" />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </HuddleShell>
  );
}
