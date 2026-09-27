import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft, CalendarDays, Clock, MapPin, Navigation, Users, MessageSquare, Lock, Edit2, ClipboardList, Ban, Rocket, Share2, Globe2, Loader2, Images,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useHuddleRole } from "@/hooks/use-huddle-role";
import { Avatar } from "@/components/AppShell";
import { MessageButton } from "@/components/MessageButton";
import { HuddleShell } from "@/components/huddle/HuddleShell";
import { EventStatusBadge } from "@/components/huddle/EventStatusBadge";
import { Countdown } from "@/components/huddle/Countdown";
import { RegisterButton } from "@/components/huddle/RegisterButton";
import { AttendeeAvatars } from "@/components/huddle/AttendeeAvatars";
import { ImageLightbox } from "@/components/huddle/ImageLightbox";
import { EmptyState } from "@/components/huddle/States";
import { useNow } from "@/components/huddle/useNow";
import {
  EVENT_DETAIL_SELECT, computeEventState, formatEventDate, formatEventTimeRange, fullAddress, getDirectionsUrl, getMapEmbedUrl, GUEST_ROLE_LABEL,
  browserTimezone, tzShortName, sameDay, type Attendee, type HuddleEvent,
} from "@/lib/huddle";

export const Route = createFileRoute("/huddle/$eventId")({
  component: EventPage,
  head: () => ({ meta: [{ title: "Huddle — OpenBuilder × Huddle" }] }),
});

function EventPage() {
  const { eventId } = Route.useParams();
  const { user } = useAuth();
  const { isAdmin } = useHuddleRole();
  const nav = useNavigate();
  const now = useNow(30_000);
  const [event, setEvent] = useState<HuddleEvent | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [busyStatus, setBusyStatus] = useState(false);

  const load = async (soft = false) => {
    if (!soft) setLoading(true);
    const { data, error } = await supabase.from("events").select(EVENT_DETAIL_SELECT).eq("id", eventId).maybeSingle();
    if (error || !data) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setEvent(data as unknown as HuddleEvent);
    const [{ data: regs }, mine] = await Promise.all([
      supabase
        .from("event_registrations")
        .select("id, user_id, registered_at, status, user:profiles!event_registrations_user_id_fkey(id, username, display_name, avatar_url)")
        .eq("event_id", eventId)
        .eq("status", "registered")
        .order("registered_at", { ascending: false })
        .limit(120),
      user ? supabase.from("event_registrations").select("status").eq("event_id", eventId).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    setAttendees((regs ?? []) as unknown as Attendee[]);
    setRegistered(mine.data?.status === "registered");
    setLoading(false);
  };

  useEffect(() => { load(); }, [eventId, user?.id]);

  useEffect(() => {
    const ch = supabase
      .channel(`huddle-event:${eventId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "event_registrations", filter: `event_id=eq.${eventId}` }, () => load(true))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "events", filter: `id=eq.${eventId}` }, () => load(true))
      .subscribe();
    return () => { ch.unsubscribe(); };
  }, [eventId]);

  const isManager = !!user && !!event && (event.organizer_id === user.id || isAdmin);
  const state = event ? computeEventState(event, now ?? new Date()) : "upcoming";
  const gallery = useMemo(() => {
    if (!event) return [];
    const imgs = (event.images ?? []).slice().sort((a, b) => a.sort_order - b.sort_order).map((i) => i.image_url);
    return event.cover_image_url ? [event.cover_image_url, ...imgs] : imgs;
  }, [event]);
  const guests = useMemo(() => (event?.guests ?? []).slice().sort((a, b) => a.sort_order - b.sort_order), [event]);
  const attendeeProfiles = attendees.map((a) => a.user).filter(Boolean);
  const canSeeChat = registered || isManager;
  const myTz = browserTimezone();

  const setStatus = async (status: "published" | "cancelled" | "draft") => {
    if (!event) return;
    if (status === "cancelled" && !confirm("Cancel this huddle? Registered builders will be notified.")) return;
    setBusyStatus(true);
    const { error } = await supabase.from("events").update({ status }).eq("id", event.id);
    setBusyStatus(false);
    if (error) return toast.error(error.message);
    toast.success(status === "published" ? "Huddle published" : status === "cancelled" ? "Huddle cancelled" : "Moved to draft");
    load(true);
  };

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) await navigator.share({ title: event?.title, url });
      else { await navigator.clipboard.writeText(url); toast.success("Link copied"); }
    } catch { /* user cancelled */ }
  };

  if (loading) return <HuddleShell><EventSkeleton /></HuddleShell>;

  if (notFound || !event) {
    return (
      <HuddleShell>
        <div className="mx-auto max-w-3xl p-6 md:p-10">
          <EmptyState title="Huddle not found." sub="It may be a draft you don't have access to, or it was removed." cta={<Link to="/huddle" className="brutal-btn text-xs"><ArrowLeft className="h-3.5 w-3.5" /> Back to huddles</Link>} />
        </div>
      </HuddleShell>
    );
  }

  const dateLabel = formatEventDate(event.starts_at, event.timezone);
  const endsSameDay = sameDay(event.starts_at, event.ends_at, event.timezone);

  return (
    <HuddleShell>
      <div className="pb-32 lg:pb-24">
        {/* ------------------------------------------------------- hero */}
        <div className="relative h-56 overflow-hidden border-b-2 border-white/10 bg-ink sm:h-72 md:h-[420px]">
          <div className="absolute inset-0 grid-bg opacity-30" />
          {event.cover_image_url ? (
            <>
              <img src={event.cover_image_url} alt="" className={`h-full w-full object-cover ${state === "cancelled" ? "grayscale" : ""}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/25 to-transparent" />
          )}
          <div className="absolute inset-0 scan-noise opacity-15" />
          <div className="absolute left-4 top-4 flex items-center gap-2 md:left-8">
            <Link to="/huddle" className="brutal-btn brutal-btn-ghost bg-black/60 px-3 py-1.5 text-[10px] backdrop-blur-sm"><ArrowLeft className="h-3.5 w-3.5" /> Huddle</Link>
          </div>
          <div className="absolute right-4 top-4 flex items-center gap-2 md:right-8">
            {gallery.length > 1 && (
              <button onClick={() => setLightbox(0)} className="brutal-btn brutal-btn-ghost bg-black/60 px-3 py-1.5 text-[10px] backdrop-blur-sm"><Images className="h-3.5 w-3.5" /> {gallery.length} photos</button>
            )}
            <button onClick={share} className="brutal-btn brutal-btn-ghost bg-black/60 px-3 py-1.5 text-[10px] backdrop-blur-sm" aria-label="Share"><Share2 className="h-3.5 w-3.5" /></button>
          </div>
        </div>

        <div className="relative z-10 mx-auto -mt-20 max-w-6xl px-4 md:-mt-28 md:px-8">
          {isManager && event.status === "draft" && (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-2 border-primary bg-primary/10 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-widest">
              <span>Draft — only organizers can see this page.</span>
              <button disabled={busyStatus} onClick={() => setStatus("published")} className="brutal-btn px-3 py-1 text-[10px]">
                {busyStatus ? <Loader2 className="h-3 w-3 animate-spin" /> : <Rocket className="h-3 w-3" />} Publish now
              </button>
            </div>
          )}

          {/* ------------------------------------------------ title card */}
          <div className="brutal-card bg-card p-5 md:p-8" style={{ boxShadow: "8px 8px 0 0 var(--primary)" }}>
            <div className="flex flex-wrap items-center gap-2">
              <EventStatusBadge event={event} size="md" />
              <span className="pill text-muted-foreground"><MapPin className="mr-1 h-3 w-3" />{event.city}{event.state ? `, ${event.state}` : ""}</span>
              {event.capacity && <span className="pill text-muted-foreground">{event.registration_count}/{event.capacity} seats</span>}
            </div>
            <h1 className="mt-3 font-display text-4xl font-black uppercase leading-[0.9] tracking-tight md:text-6xl">{event.title}</h1>
            {event.tagline && <p className="mt-3 max-w-2xl text-lg text-muted-foreground md:text-xl">{event.tagline}</p>}

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <InfoTile icon={<CalendarDays className="h-4 w-4" />} label="Date" value={dateLabel} sub={!endsSameDay ? `ends ${formatEventDate(event.ends_at, event.timezone, { weekday: undefined, year: undefined })}` : undefined} />
              <InfoTile
                icon={<Clock className="h-4 w-4" />}
                label={`Time · ${tzShortName(event.starts_at, event.timezone)}`}
                value={formatEventTimeRange(event.starts_at, event.ends_at, event.timezone)}
                sub={myTz !== event.timezone ? `${formatEventTimeRange(event.starts_at, event.ends_at, myTz)} your time` : undefined}
              />
              <InfoTile icon={<MapPin className="h-4 w-4" />} label="Venue" value={event.venue_name} sub={event.city} />
            </div>

            <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center">
              <Link to="/u/$username" params={{ username: event.organizer.username }} className="flex items-center gap-2">
                <Avatar profile={event.organizer} size={40} />
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Organized by</div>
                  <div className="text-sm font-bold">{event.organizer.display_name || event.organizer.username} <span className="font-mono text-xs text-muted-foreground">@{event.organizer.username}</span></div>
                </div>
              </Link>
              <div className="flex-1" />
              <div className="hidden w-full md:block md:w-72">
                <RegisterButton event={event} registered={registered} onChange={() => load(true)} />
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------ body */}
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {/* ASIDE — first on mobile so countdown / CTA are immediate */}
            <aside className="order-first space-y-4 lg:order-last">
              <Countdown event={event} />

              <div className="brutal-card-flat p-4 md:hidden">
                <RegisterButton event={event} registered={registered} onChange={() => load(true)} size="md" />
              </div>

              {/* who's coming */}
              <section id="attendees" className="brutal-card-flat p-4 md:p-5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="flex items-center gap-2 font-display text-lg font-black uppercase tracking-tight"><Users className="h-4 w-4 text-primary" /> Who's coming?</h2>
                  <span className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">{event.registration_count} builders</span>
                </div>
                {attendees.length === 0 ? (
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {state === "cancelled" ? "Nobody's coming — this huddle was cancelled." : "Be the first builder in the room."}
                  </p>
                ) : (
                  <>
                    <div className="mt-3"><AttendeeAvatars attendees={attendeeProfiles} total={event.registration_count} max={8} size={34} /></div>
                    <ul className="mt-4 space-y-2">
                      {(showAll ? attendees : attendees.slice(0, 6)).map((a) => (
                        <li key={a.id} className="flex items-center gap-2">
                          <Link to="/u/$username" params={{ username: a.user.username }} className="flex min-w-0 flex-1 items-center gap-2 hover:text-primary">
                            <Avatar profile={a.user} size={30} />
                            <div className="min-w-0">
                              <div className="truncate text-sm font-bold">{a.user.display_name || a.user.username}</div>
                              <div className="truncate font-mono text-[10px] text-muted-foreground">@{a.user.username}</div>
                            </div>
                          </Link>
                          {canSeeChat && <MessageButton targetId={a.user.id} size="sm" />}
                        </li>
                      ))}
                    </ul>
                    {attendees.length > 6 && (
                      <button onClick={() => setShowAll((v) => !v)} className="mt-3 font-mono text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
                        {showAll ? "Show less" : `Show all ${attendees.length}`}
                      </button>
                    )}
                  </>
                )}
              </section>

              {/* event chat */}
              <section className="brutal-card-flat relative overflow-hidden p-4 md:p-5">
                <div className="huddle-dots pointer-events-none absolute inset-0 opacity-30" />
                <div className="relative">
                  <h2 className="flex items-center gap-2 font-display text-lg font-black uppercase tracking-tight"><MessageSquare className="h-4 w-4 text-primary" /> Event chat</h2>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {event.title} · {event.registration_count + 1} members
                  </p>
                  {canSeeChat && event.chat_id ? (
                    <Link to="/chat" search={{ id: event.chat_id }} className="brutal-btn mt-4 w-full justify-center text-xs"><MessageSquare className="h-4 w-4" /> Open event chat</Link>
                  ) : (
                    <div className="mt-4 flex items-center gap-2 border-2 border-dashed border-white/30 p-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      <Lock className="h-3.5 w-3.5 text-primary" /> Register to unlock the private group chat with every attendee.
                    </div>
                  )}
                </div>
              </section>

              {/* organizer tools */}
              {isManager && (
                <section className="brutal-card-flat border-primary/50 p-4 md:p-5">
                  <h2 className="font-display text-sm font-black uppercase tracking-tight text-primary">Organizer tools</h2>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Link to="/huddle/$eventId/edit" params={{ eventId: event.id }} className="brutal-btn brutal-btn-ghost justify-center py-2 text-[10px]"><Edit2 className="h-3 w-3" /> Edit</Link>
                    <Link to="/huddle/$eventId/attendees" params={{ eventId: event.id }} className="brutal-btn brutal-btn-ghost justify-center py-2 text-[10px]"><ClipboardList className="h-3 w-3" /> Attendees</Link>
                    {event.status === "draft" && (
                      <button disabled={busyStatus} onClick={() => setStatus("published")} className="brutal-btn col-span-2 justify-center py-2 text-[10px]"><Rocket className="h-3 w-3" /> Publish</button>
                    )}
                    {event.status === "published" && state !== "completed" && (
                      <button disabled={busyStatus} onClick={() => setStatus("cancelled")} className="brutal-btn brutal-btn-danger col-span-2 justify-center py-2 text-[10px]"><Ban className="h-3 w-3" /> Cancel event</button>
                    )}
                    {event.status === "cancelled" && (
                      <button disabled={busyStatus} onClick={() => setStatus("published")} className="brutal-btn col-span-2 justify-center py-2 text-[10px]"><Rocket className="h-3 w-3" /> Re-publish</button>
                    )}
                  </div>
                </section>
              )}
            </aside>

            {/* MAIN */}
            <div className="space-y-6 lg:col-span-2">
              {event.description && (
                <section className="brutal-card-flat p-5 md:p-6">
                  <h2 className="font-display text-xl font-black uppercase tracking-tight">About the event</h2>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed md:text-base">{event.description}</p>
                </section>
              )}

              {gallery.length > 1 && (
                <section className="brutal-card-flat p-5 md:p-6">
                  <h2 className="font-display text-xl font-black uppercase tracking-tight">Gallery</h2>
                  <div className="mt-4 grid grid-cols-3 gap-2 md:grid-cols-4">
                    {gallery.map((src, i) => (
                      <button
                        key={src + i}
                        type="button"
                        aria-label={`Open photo ${i + 1} of ${gallery.length}`}
                        onClick={() => setLightbox(i)}
                        className={`relative overflow-hidden border-2 border-white/20 bg-ink hover:border-primary ${i === 0 ? "col-span-2 row-span-2 aspect-square md:aspect-auto" : "aspect-square"}`}
                      >
                        <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {guests.length > 0 && (
                <section className="brutal-card-flat p-5 md:p-6">
                  <div className="flex items-end justify-between gap-2">
                    <h2 className="font-display text-xl font-black uppercase tracking-tight">Meet the people</h2>
                    <span className="pill text-primary">{guests.length} special guest{guests.length === 1 ? "" : "s"}</span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {guests.map((g) => (
                      <div key={g.id} className="brutal-card group flex gap-3 bg-ink/50 p-3">
                        <div className="h-20 w-20 shrink-0 overflow-hidden border-2 border-white bg-card" style={{ boxShadow: "3px 3px 0 0 var(--primary)" }}>
                          {g.image_url ? <img src={g.image_url} alt={g.name} className="h-full w-full object-cover" /> : (
                            <div className="grid h-full place-items-center font-display text-3xl font-black text-primary">{g.name[0]?.toUpperCase()}</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="inline-block border border-primary bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-widest text-primary">{GUEST_ROLE_LABEL[g.role] ?? g.role}</span>
                          <div className="mt-1 font-display text-base font-black leading-tight">{g.name}</div>
                          {g.designation && <div className="text-xs text-muted-foreground">{g.designation}</div>}
                          {g.organization && <div className="font-mono text-[10px] uppercase tracking-wider text-foreground/80">{g.organization}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* location */}
              <section className="brutal-card-flat overflow-hidden">
                <div className="p-5 md:p-6">
                  <h2 className="flex items-center gap-2 font-display text-xl font-black uppercase tracking-tight"><Globe2 className="h-5 w-5 text-primary" /> Location</h2>
                </div>
                <div className="grid md:grid-cols-[1fr_280px]">
                  <iframe
                    title="map"
                    src={getMapEmbedUrl(event)}
                    className="h-56 w-full border-y-2 border-white/15 grayscale-[30%] md:h-72 md:border-r-2"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  <div className="flex flex-col justify-between gap-4 p-5">
                    <div>
                      <div className="font-display text-lg font-black uppercase leading-tight">{event.venue_name}</div>
                      <p className="mt-1 text-sm text-muted-foreground">{fullAddress(event, false)}</p>
                    </div>
                    <a href={getDirectionsUrl(event)} target="_blank" rel="noreferrer" className="brutal-btn w-full justify-center text-xs"><Navigation className="h-4 w-4" /> Get directions</a>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* mobile sticky CTA */}
        <div className="fixed inset-x-0 bottom-[calc(4.6rem+env(safe-area-inset-bottom))] z-40 px-3 md:hidden">
          <div className="border-2 border-white bg-card/95 p-2 shadow-[4px_4px_0_0_var(--primary)] backdrop-blur-sm">
            <RegisterButton event={event} registered={registered} onChange={() => load(true)} size="md" />
          </div>
        </div>

        <ImageLightbox images={gallery} index={lightbox} onClose={() => setLightbox(null)} onIndex={setLightbox} />
      </div>
    </HuddleShell>
  );
}

function InfoTile({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="border-2 border-white/15 bg-ink/50 p-3">
      <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground"><span className="text-primary">{icon}</span>{label}</div>
      <div className="mt-1 font-display text-sm font-black uppercase leading-tight md:text-base">{value}</div>
      {sub && <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function EventSkeleton() {
  return (
    <div className="pb-24">
      <div className="h-56 animate-pulse bg-white/5 sm:h-72 md:h-[420px]" />
      <div className="mx-auto -mt-20 max-w-6xl px-4 md:-mt-28 md:px-8">
        <div className="brutal-card-flat p-6 md:p-8">
          <div className="h-5 w-40 animate-pulse bg-primary/30" />
          <div className="mt-4 h-12 w-3/4 animate-pulse bg-white/10" />
          <div className="mt-3 h-5 w-1/2 animate-pulse bg-white/5" />
          <div className="mt-6 grid gap-3 sm:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse bg-white/5" />)}</div>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:order-last"><div className="h-32 animate-pulse bg-white/5" /><div className="h-48 animate-pulse bg-white/5" /></div>
          <div className="space-y-6 lg:col-span-2"><div className="h-40 animate-pulse bg-white/5" /><div className="h-64 animate-pulse bg-white/5" /></div>
        </div>
      </div>
    </div>
  );
}
