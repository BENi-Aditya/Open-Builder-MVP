import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowUpRight, CalendarDays, Flame, MapPin, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AttendeeAvatars } from "@/components/huddle/AttendeeAvatars";
import { EVENT_CARD_SELECT, formatEventDate, type HuddleEvent, type MiniProfile } from "@/lib/huddle";

/**
 * Orange "Huddle Season" card for the OpenBuilder feed.
 * Shows the next upcoming huddle, how many builders are in, and links to /huddle.
 */
export function HuddleSpotlight() {
  const [next, setNext] = useState<HuddleEvent | null>(null);
  const [upcoming, setUpcoming] = useState(0);
  const [attending, setAttending] = useState(0);
  const [preview, setPreview] = useState<MiniProfile[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("events")
        .select(EVENT_CARD_SELECT)
        .eq("status", "published")
        .gte("ends_at", nowIso)
        .order("starts_at", { ascending: true })
        .limit(40);
      if (!alive) return;
      if (error) {
        // Table may not exist yet — still render the section, just without live numbers.
        setReady(true);
        return;
      }
      const list = (data ?? []) as unknown as HuddleEvent[];
      const first = list[0] ?? null;
      setNext(first);
      setUpcoming(list.length);
      setAttending(list.reduce((n, e) => n + (e.registration_count ?? 0), 0));
      if (first) {
        const { data: regs } = await supabase
          .from("event_registrations")
          .select("user:profiles!event_registrations_user_id_fkey(id, username, display_name, avatar_url)")
          .eq("event_id", first.id)
          .eq("status", "registered")
          .order("registered_at", { ascending: false })
          .limit(5);
        if (!alive) return;
        setPreview(((regs ?? []) as unknown as { user: MiniProfile | null }[]).map((r) => r.user).filter(Boolean) as MiniProfile[]);
      }
      setReady(true);
    })();
    return () => { alive = false; };
  }, []);

  return (
    <section className="huddle-theme mb-6">
      <Link
        to="/huddle"
        className="brutal-card relative block overflow-hidden bg-ink p-5 md:p-6"
        style={{ boxShadow: "6px 6px 0 0 var(--huddle)" }}
      >
        <div className="huddle-glow pointer-events-none absolute -right-16 -top-16 h-56 w-56 opacity-70" />
        <div className="huddle-stripes pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 -rotate-12 opacity-20" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <span className="pill border-huddle text-huddle"><Flame className="mr-1 h-3 w-3" /> huddle season</span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">openbuilder × huddle</span>
          </div>

          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <h2 className="font-display text-2xl font-black uppercase leading-[0.95] tracking-tight md:text-3xl">
                6 weeks. Build online.
                <br />
                <span className="text-huddle">Huddle offline.</span>
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                The flagship builder sprint. Weekly sessions on Google Meet, then an offline finale where you demo what you shipped.
              </p>

              {ready && next ? (
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span className="flex items-center gap-1.5 text-foreground"><CalendarDays className="h-3.5 w-3.5 text-huddle" /> next: <b>{next.title}</b></span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-huddle" /> {next.city} · {formatEventDate(next.starts_at, next.timezone, { weekday: undefined, year: undefined })}</span>
                  {preview.length > 0 && (
                    <span className="flex items-center gap-2">
                      <AttendeeAvatars attendees={preview} total={next.registration_count} max={4} size={22} linkable={false} />
                      <span>{next.registration_count} in</span>
                    </span>
                  )}
                </div>
              ) : ready ? (
                <div className="mt-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Season 1 is warming up. Be the first builder in the room.
                </div>
              ) : (
                <div className="mt-4 h-4 w-56 animate-pulse bg-white/10" />
              )}
            </div>

            <div className="flex shrink-0 items-center gap-3 md:flex-col md:items-end">
              <div className="flex gap-2 font-mono text-[10px] uppercase tracking-wider">
                <span className="border-2 border-white/20 bg-black/40 px-2 py-1"><b className="text-huddle">{upcoming}</b> upcoming</span>
                <span className="flex items-center gap-1 border-2 border-white/20 bg-black/40 px-2 py-1"><Users className="h-3 w-3 text-huddle" /><b className="text-foreground">{attending}</b> in</span>
              </div>
              <span className="brutal-btn px-3 py-2 text-[10px]">Go to Huddle <ArrowUpRight className="h-3.5 w-3.5" /></span>
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}
