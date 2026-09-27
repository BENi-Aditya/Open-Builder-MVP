import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown, ArrowUpRight, CalendarCheck, Flame, MapPin, Search, Sparkles, Ticket, Trophy, Users, Video, Zap, RefreshCw, Rocket,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useHuddleRole } from "@/hooks/use-huddle-role";
import { Avatar } from "@/components/AppShell";
import { FollowButton } from "@/components/FollowButton";
import { HuddleShell, HuddleNav } from "@/components/huddle/HuddleShell";
import { EventCard, EventCardSkeleton } from "@/components/huddle/EventCard";
import { useNow } from "@/components/huddle/useNow";
import { computeEventState, EVENT_CARD_SELECT, type HuddleEvent, type MiniProfile } from "@/lib/huddle";
import { EmptyState, ErrorState } from "@/components/huddle/States";

export const Route = createFileRoute("/huddle/")({
  component: HuddlePage,
  validateSearch: (s: Record<string, unknown>): { tab?: "mine"; q?: string } => ({
    ...(s.tab === "mine" ? { tab: "mine" as const } : {}),
    ...(typeof s.q === "string" && s.q ? { q: s.q } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Huddle Season — OpenBuilder × Huddle" },
      { name: "description", content: "Huddle Season: the flagship 6-week program where builders stop waiting and start doing. Build online every week, then huddle offline at the finale." },
    ],
  }),
});

type Filter = "upcoming" | "live" | "past";

/** A builder who has registered for at least one huddle, with how many they've joined. */
type SeasonBuilder = MiniProfile & { huddles: number };

function HuddlePage() {
  const { tab, q } = Route.useSearch();
  const { user } = useAuth();
  const { isOrganizer } = useHuddleRole();
  const now = useNow(60_000);
  const [events, setEvents] = useState<HuddleEvent[]>([]);
  const [previews, setPreviews] = useState<Record<string, MiniProfile[]>>({});
  const [builders, setBuilders] = useState<SeasonBuilder[]>([]);
  const [mine, setMine] = useState<HuddleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [city, setCity] = useState<string | null>(null);
  const [query, setQuery] = useState(q ?? "");
  const [showAllBuilders, setShowAllBuilders] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("events")
      .select(EVENT_CARD_SELECT)
      .in("status", ["published", "cancelled"])
      .order("starts_at", { ascending: true })
      .limit(80);
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    const list = (data ?? []) as unknown as HuddleEvent[];
    setEvents(list);

    if (list.length) {
      const { data: regs } = await supabase
        .from("event_registrations")
        .select("event_id, user:profiles!event_registrations_user_id_fkey(id, username, display_name, avatar_url)")
        .in("event_id", list.map((e) => e.id))
        .eq("status", "registered")
        .order("registered_at", { ascending: false })
        .limit(400);
      const map: Record<string, MiniProfile[]> = {};
      const people = new Map<string, SeasonBuilder>();
      for (const r of (regs ?? []) as unknown as { event_id: string; user: MiniProfile }[]) {
        if (!r.user) continue;
        const bucket = (map[r.event_id] ??= []);
        if (bucket.length < 5) bucket.push(r.user);
        const existing = people.get(r.user.id);
        if (existing) existing.huddles += 1;
        else people.set(r.user.id, { ...r.user, huddles: 1 });
      }
      setPreviews(map);
      setBuilders(Array.from(people.values()).sort((a, b) => b.huddles - a.huddles));
    } else {
      setPreviews({});
      setBuilders([]);
    }

    if (user) {
      const { data: my } = await supabase
        .from("event_registrations")
        .select(`event:events(${EVENT_CARD_SELECT})`)
        .eq("user_id", user.id)
        .eq("status", "registered")
        .order("registered_at", { ascending: false });
      setMine(((my ?? []) as unknown as { event: HuddleEvent | null }[]).map((r) => r.event).filter(Boolean) as HuddleEvent[]);
    } else {
      setMine([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("huddle-registrations")
      .on("postgres_changes", { event: "*", schema: "public", table: "event_registrations" }, () => load())
      .subscribe();
    return () => { ch.unsubscribe(); };
  }, [user?.id]);

  const t = now ?? new Date();
  const cities = useMemo(() => Array.from(new Set(events.map((e) => e.city).filter(Boolean))).sort(), [events]);

  const filtered = useMemo(() => {
    const at = now ?? new Date();
    return events.filter((e) => {
      const st = computeEventState(e, at);
      const byFilter = filter === "live" ? st === "live" : filter === "past" ? st === "completed" || st === "cancelled" : st !== "completed" && st !== "cancelled";
      const byCity = !city || e.city === city;
      const qq = query.trim().toLowerCase();
      const byQuery = !qq || e.title.toLowerCase().includes(qq) || (e.tagline ?? "").toLowerCase().includes(qq) || e.city.toLowerCase().includes(qq) || e.venue_name.toLowerCase().includes(qq);
      return byFilter && byCity && byQuery;
    }).sort((a, b) => (filter === "past" ? +new Date(b.starts_at) - +new Date(a.starts_at) : +new Date(a.starts_at) - +new Date(b.starts_at)));
  }, [events, filter, city, query, now]);

  const upcomingEvents = useMemo(() => {
    const at = now ?? new Date();
    return events.filter((e) => { const s = computeEventState(e, at); return s !== "completed" && s !== "cancelled"; });
  }, [events, now]);
  const upcomingCount = upcomingEvents.length;
  const attendingTotal = useMemo(() => events.reduce((n, e) => n + (e.registration_count ?? 0), 0), [events]);
  const liveCount = useMemo(() => events.filter((e) => computeEventState(e, now ?? new Date()) === "live").length, [events, now]);
  const nextEvent = upcomingEvents[0] ?? null;

  return (
    <HuddleShell>
      <div className="mx-auto max-w-6xl p-4 pb-24 md:p-8">
        {/* ---------------------------------------------------------- hero */}
        <header className="brutal-card relative overflow-hidden bg-ink p-6 md:p-10" style={{ boxShadow: "8px 8px 0 0 var(--primary)" }}>
          <div className="grid-bg absolute inset-0 opacity-30" />
          <div className="huddle-glow pointer-events-none absolute -right-24 -top-24 h-80 w-80 opacity-80" />
          <div className="huddle-stripes absolute -bottom-10 -left-10 h-36 w-36 -rotate-12 opacity-20 md:h-48 md:w-48" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <span className="pill text-primary">// openbuilder × huddle</span>
              <span className="pill border-white/30 text-muted-foreground">season 1 · {nextEvent ? "registrations open" : "coming soon"}</span>
              {liveCount > 0 && (
                <span className="inline-flex items-center gap-1.5 border-2 border-white bg-[var(--citrus)] px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-widest text-white">
                  <span className="h-2 w-2 animate-pulse bg-white" /> {liveCount} live now
                </span>
              )}
            </div>
            <h1 className="mt-4 font-display text-5xl font-black uppercase leading-[0.88] tracking-tight sm:text-6xl md:text-8xl">
              Huddle
              <br />
              <span className="inline-block bg-primary px-2 text-primary-foreground" style={{ boxShadow: "6px 6px 0 0 #fff" }}>Season.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
              The flagship 6-week program where builders and creators stop waiting and start doing. Build your app, brand, or design alongside the most ambitious builders on OpenBuilder.
            </p>
            <p className="mt-3 max-w-2xl font-mono text-[11px] uppercase tracking-wider text-foreground/80">
              <Video className="mr-1 inline h-3.5 w-3.5 text-primary" /> weekly sessions online on Google Meet
              <span className="mx-2 text-primary">◆</span>
              <MapPin className="mr-1 inline h-3.5 w-3.5 text-primary" /> offline finale in Bangalore or Mumbai
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#events" className="brutal-btn text-xs"><Ticket className="h-4 w-4" /> Upcoming events <ArrowDown className="h-3.5 w-3.5" /></a>
              {user ? (
                <Link to="/huddle" search={{ tab: "mine" }} className="brutal-btn brutal-btn-ghost text-xs"><CalendarCheck className="h-4 w-4" /> My huddles</Link>
              ) : (
                <Link to="/auth" className="brutal-btn brutal-btn-ghost text-xs"><Users className="h-4 w-4" /> Join the community</Link>
              )}
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3 font-mono text-xs sm:grid-cols-3 lg:grid-cols-5">
              <Stat icon={<Zap className="h-3.5 w-3.5" />} value={6} label="weeks of building" />
              <Stat icon={<Trophy className="h-3.5 w-3.5" />} value={1} label="offline finale" />
              <Stat icon={<Flame className="h-3.5 w-3.5" />} value={upcomingCount} label="upcoming huddles" />
              <Stat icon={<Users className="h-3.5 w-3.5" />} value={attendingTotal} label="builders in" />
              <Stat icon={<MapPin className="h-3.5 w-3.5" />} value={cities.length} label={cities.length === 1 ? "city" : "cities"} />
            </div>
          </div>
        </header>

        {/* marquee */}
        <div className="mt-4 overflow-hidden border-y-2 border-white/15 py-2">
          <div className="huddle-marquee font-mono text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">
            {[...Array(2)].map((_, k) => (
              <span key={k} className="flex gap-10">
                <span>build online · huddle offline</span><span className="text-primary">◆</span>
                <span>6 weeks · 1 finale</span><span className="text-primary">◆</span>
                <span>stop waiting · start doing</span><span className="text-primary">◆</span>
                <span>meet the people behind the builds</span><span className="text-primary">◆</span>
                {cities.slice(0, 6).map((c) => <span key={c} className="flex gap-10"><span>{c}</span><span className="text-primary">◆</span></span>)}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <HuddleNav />
        </div>

        {tab === "mine" ? (
          <MyHuddles mine={mine} loading={loading} signedIn={!!user} now={t} previews={previews} />
        ) : (
          <>
            {/* ------------------------------------------------- events */}
            <section id="events" className="mt-8 scroll-mt-6">
              <SectionHeading
                eyebrow="the calendar"
                title="Upcoming huddles"
                sub="Every session is an event. Register to see who's coming, unlock the attendee list, and get into the private event chat."
              />

              <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center">
                <div className="flex gap-2">
                  {(["upcoming", "live", "past"] as Filter[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`pill ${filter === f ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {f === "live" && <Zap className="mr-1 h-3 w-3" />}{f}
                    </button>
                  ))}
                </div>
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="search huddles, cities, venues…" className="brutal-input py-2 pl-8 text-xs" />
                </div>
                {cities.length > 1 && (
                  <select value={city ?? ""} onChange={(e) => setCity(e.target.value || null)} className="brutal-input py-2 text-xs md:w-48">
                    <option value="">All cities</option>
                    {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                )}
              </div>

              <div className="mt-5">
                {error ? (
                  <ErrorState message={error} onRetry={load} />
                ) : loading ? (
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((i) => <EventCardSkeleton key={i} />)}</div>
                ) : filtered.length === 0 ? (
                  <EmptyState
                    title={events.length === 0 ? "Season 1 is warming up." : `No ${filter} huddles${city ? ` in ${city}` : ""}.`}
                    sub={events.length === 0 ? "No huddles published yet. Organizers are setting up the room — check back soon." : "Try another filter, or clear your search."}
                    cta={events.length === 0 ? (isOrganizer ? <Link to="/huddle/create" className="brutal-btn text-xs"><Rocket className="h-3.5 w-3.5" /> Create the first huddle</Link> : undefined) : (
                      <button onClick={() => { setFilter("upcoming"); setCity(null); setQuery(""); }} className="brutal-btn text-xs"><RefreshCw className="h-3.5 w-3.5" /> Reset filters</button>
                    )}
                  />
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((e) => <EventCard key={e.id} event={e} attendeePreview={previews[e.id] ?? []} />)}
                  </div>
                )}
              </div>
            </section>

            {/* ----------------------------------------------- builders */}
            {!error && (
              <section className="mt-12">
                <SectionHeading
                  eyebrow="who's in"
                  title="Builders in the huddle"
                  sub={builders.length > 0
                    ? `${builders.length} builder${builders.length === 1 ? "" : "s"} registered across ${events.length} huddle${events.length === 1 ? "" : "s"}. Follow them, check their projects, say hi.`
                    : "The people you'll be building alongside show up here once they register."}
                />
                {loading ? (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="brutal-card-flat h-20 animate-pulse" />)}</div>
                ) : builders.length === 0 ? (
                  <div className="brutal-card-flat mt-5 border-dashed p-6 text-center font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    Nobody's in the room yet. Be the first builder.
                  </div>
                ) : (
                  <>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {(showAllBuilders ? builders : builders.slice(0, 9)).map((b) => (
                        <div key={b.id} className="brutal-card-flat flex items-center gap-3 p-3 transition-colors hover:border-primary">
                          <Link to="/u/$username" params={{ username: b.username }}><Avatar profile={b} size={44} /></Link>
                          <div className="min-w-0 flex-1">
                            <Link to="/u/$username" params={{ username: b.username }} className="block truncate text-sm font-bold hover:text-primary">{b.display_name || b.username}</Link>
                            <div className="truncate font-mono text-[10px] text-muted-foreground">@{b.username} · {b.huddles} huddle{b.huddles === 1 ? "" : "s"}</div>
                          </div>
                          {user && user.id !== b.id ? <FollowButton targetId={b.id} size="sm" /> : null}
                        </div>
                      ))}
                    </div>
                    {builders.length > 9 && (
                      <button onClick={() => setShowAllBuilders((v) => !v)} className="mt-4 font-mono text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
                        {showAllBuilders ? "Show fewer" : `Show all ${builders.length} builders`}
                      </button>
                    )}
                  </>
                )}
              </section>
            )}

            {/* ------------------------------------------------- vision */}
            <section className="mt-14 grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
              <div>
                <SectionHeading eyebrow="the program" title="What is Huddle Season?" />
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
                  Huddle Season is the flagship 6-week program where builders and creators come together to build, create, and grow. Whether you're working on an app, a brand, a design, or an idea you've had for too long, Season gives you the structure, the community, and the push to finally make it real.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                  Every week you show up online, share your progress, and keep building. At the end of 6 weeks, everyone comes together at an offline finale to present what they've built, meet the people they've been building alongside, and celebrate what happens when builders stop waiting and start doing.
                </p>
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <BigStat value="6" label="weeks of building" />
                  <BigStat value="1" label="offline finale" />
                  <BigStat value="Online" label="weekly on Google Meet" small />
                  <BigStat value="Offline" label="Bangalore · Mumbai" small />
                </div>
              </div>
              <div className="brutal-card relative overflow-hidden bg-ink p-8 text-center md:p-12" style={{ boxShadow: "8px 8px 0 0 var(--primary)" }}>
                <div className="huddle-glow pointer-events-none absolute inset-0 opacity-60" />
                <div className="huddle-dots pointer-events-none absolute inset-0 opacity-30" />
                <div className="relative">
                  <div className="mx-auto grid h-20 w-20 -rotate-3 place-items-center border-2 border-white bg-primary text-primary-foreground" style={{ boxShadow: "5px 5px 0 0 #fff" }}>
                    <Rocket className="h-10 w-10" />
                  </div>
                  <div className="mt-6 font-display text-3xl font-black uppercase leading-[0.95] tracking-tight md:text-4xl">Turn ideas into reality</div>
                  <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">community on openbuilder · season on huddle</div>
                </div>
              </div>
            </section>

            {/* ------------------------------------------------ journey */}
            <section className="mt-14">
              <SectionHeading eyebrow="how it works" title="The Journey" center />
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <Feature
                  n="01"
                  icon={<Video className="h-6 w-6" />}
                  title="Weekly progress"
                  body="Every week you show up online, share your progress, and keep building. No more procrastinating alone."
                />
                <Feature
                  n="02"
                  icon={<Users className="h-6 w-6" />}
                  title="Peer community"
                  body="Meet the people you've been building alongside. Get feedback, find collaborators, and grow together on OpenBuilder."
                />
                <Feature
                  n="03"
                  icon={<Trophy className="h-6 w-6" />}
                  title="Offline finale"
                  body="At the end of 6 weeks, everyone comes together offline to present what they've built and meet in person."
                />
              </div>
            </section>

            {/* ---------------------------------------------------- cta */}
            <section className="mt-14">
              <div className="brutal-card relative overflow-hidden bg-primary p-8 text-center text-primary-foreground md:p-14" style={{ boxShadow: "8px 8px 0 0 #fff" }}>
                <div className="huddle-dots pointer-events-none absolute inset-0 opacity-30" />
                <div className="relative">
                  <div className="mx-auto grid h-14 w-14 rotate-3 place-items-center border-2 border-black bg-black text-primary">
                    <Zap className="h-7 w-7" fill="currentColor" />
                  </div>
                  <h2 className="mt-5 font-display text-4xl font-black uppercase leading-[0.9] tracking-tight md:text-6xl">Ready to build?</h2>
                  <p className="mx-auto mt-4 max-w-xl text-sm font-medium md:text-base">
                    {nextEvent
                      ? `The next huddle is ${nextEvent.title} in ${nextEvent.city}. Grab your seat before registration closes.`
                      : "Huddle Season 1 is coming. Join the community now and you'll be first to know when registrations open."}
                  </p>
                  <div className="mt-7 flex flex-wrap justify-center gap-3">
                    {nextEvent ? (
                      <Link to="/huddle/$eventId" params={{ eventId: nextEvent.id }} className="brutal-btn border-black bg-black text-white shadow-[4px_4px_0_0_#000] hover:shadow-[6px_6px_0_0_#000]">
                        <Ticket className="h-4 w-4" /> Register for {nextEvent.title} <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    ) : user ? (
                      <Link to="/" className="brutal-btn border-black bg-black text-white shadow-[4px_4px_0_0_#000] hover:shadow-[6px_6px_0_0_#000]">
                        <Sparkles className="h-4 w-4" /> Back to the community
                      </Link>
                    ) : (
                      <Link to="/auth" className="brutal-btn border-black bg-black text-white shadow-[4px_4px_0_0_#000] hover:shadow-[6px_6px_0_0_#000]">
                        <Users className="h-4 w-4" /> Join the community
                      </Link>
                    )}
                    {isOrganizer && (
                      <Link to="/huddle/create" className="brutal-btn border-black bg-transparent text-black shadow-[4px_4px_0_0_#000]">
                        <Rocket className="h-4 w-4" /> Create a huddle
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </HuddleShell>
  );
}

function MyHuddles({ mine, loading, signedIn, now, previews }: { mine: HuddleEvent[]; loading: boolean; signedIn: boolean; now: Date; previews: Record<string, MiniProfile[]> }) {
  if (!signedIn) {
    return <EmptyState title="Sign in to see your huddles." sub="Your registrations live here." cta={<Link to="/auth" className="brutal-btn text-xs">Sign in</Link>} />;
  }
  if (loading) return <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <EventCardSkeleton key={i} />)}</div>;
  if (mine.length === 0) {
    return (
      <EmptyState
        title="You haven't joined a huddle yet."
        sub="Pick an event, register, and you'll unlock the attendee list and the event chat."
        cta={<Link to="/huddle" className="brutal-btn text-xs"><Ticket className="h-3.5 w-3.5" /> Discover huddles</Link>}
      />
    );
  }
  const upcoming = mine.filter((e) => { const s = computeEventState(e, now); return s !== "completed" && s !== "cancelled"; }).sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at));
  const past = mine.filter((e) => !upcoming.includes(e)).sort((a, b) => +new Date(b.starts_at) - +new Date(a.starts_at));
  return (
    <div className="mt-6 space-y-8">
      <div>
        <h2 className="mb-3 font-display text-2xl font-black uppercase tracking-tight">Upcoming <span className="text-primary">({upcoming.length})</span></h2>
        {upcoming.length === 0 ? <p className="font-mono text-xs uppercase text-muted-foreground">Nothing upcoming — go find your next room.</p> : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{upcoming.map((e) => <EventCard key={e.id} event={e} attendeePreview={previews[e.id] ?? []} />)}</div>
        )}
      </div>
      {past.length > 0 && (
        <div>
          <h2 className="mb-3 font-display text-2xl font-black uppercase tracking-tight text-muted-foreground">Past</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{past.map((e) => <EventCard key={e.id} event={e} attendeePreview={previews[e.id] ?? []} />)}</div>
        </div>
      )}
    </div>
  );
}

function SectionHeading({ eyebrow, title, sub, center = false }: { eyebrow: string; title: string; sub?: string; center?: boolean }) {
  return (
    <div className={center ? "text-center" : ""}>
      <span className="pill text-primary">// {eyebrow}</span>
      <h2 className="mt-3 font-display text-3xl font-black uppercase leading-[0.95] tracking-tight md:text-4xl">{title}</h2>
      {sub && <p className={`mt-2 max-w-2xl text-sm text-muted-foreground ${center ? "mx-auto" : ""}`}>{sub}</p>}
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="flex items-center gap-2 border-2 border-white/20 bg-black/40 px-3 py-2">
      <span className="text-primary">{icon}</span>
      <b className="text-lg text-foreground">{value}</b>
      <span className="text-[10px] uppercase leading-tight tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}

function BigStat({ value, label, small = false }: { value: string; label: string; small?: boolean }) {
  return (
    <div className="border-2 border-white/15 bg-ink/60 p-3">
      <div className={`font-display font-black uppercase leading-none text-primary ${small ? "text-xl md:text-2xl" : "text-4xl md:text-5xl"}`}>{value}</div>
      <div className="mt-1.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

function Feature({ n, icon, title, body }: { n: string; icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="huddle-feature relative p-5 md:p-6">
      <div className="absolute right-4 top-3 font-display text-4xl font-black text-white/5">{n}</div>
      <div className="grid h-12 w-12 place-items-center border-2 border-white bg-primary text-primary-foreground" style={{ boxShadow: "3px 3px 0 0 #fff" }}>{icon}</div>
      <h3 className="mt-4 font-display text-xl font-black uppercase tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
