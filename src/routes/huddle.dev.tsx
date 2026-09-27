import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Beaker, CheckCircle2, XCircle, Loader2, Rocket, Ticket, Trash2, RefreshCw, Copy, ShieldCheck, ArrowUpRight, ClipboardList,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useHuddleRole } from "@/hooks/use-huddle-role";
import { HuddleShell, HuddleNav } from "@/components/huddle/HuddleShell";
import { EmptyState } from "@/components/huddle/States";
import { friendlyError, type EventRow } from "@/lib/huddle";

export const Route = createFileRoute("/huddle/dev")({
  component: DevPage,
  head: () => ({ meta: [{ title: "Huddle dev tools — OpenBuilder × Huddle" }] }),
});

const DEV_PREFIX = "[DEV]";
const H = 60 * 60 * 1000;
const D = 24 * H;

type DevEventSeed = Omit<EventRow, "id" | "organizer_id" | "created_at" | "updated_at" | "registration_count" | "chat_id" | "cover_image_url" | "latitude" | "longitude" | "maps_url"> & {
  guests?: { name: string; designation: string; organization: string; role: string }[];
};

const VENUE = { venue_name: "Scaler School of Technology", address: "Electronic City Phase 1", city: "Bengaluru", state: "Karnataka", country: "India" };

/** Same scenarios as supabase/seed/huddle_dev_seed.sql, but created by the signed-in organizer from the browser. */
function buildSeeds(now: number): DevEventSeed[] {
  const iso = (ms: number) => new Date(ms).toISOString();
  const base = { timezone: "Asia/Kolkata", registration_enabled: true, registration_deadline: null as string | null, status: "published" as EventRow["status"], description: null as string | null, tagline: null as string | null };
  return [
    { ...base, ...VENUE, title: `${DEV_PREFIX} Season 1 Kickoff`, tagline: "Week 1 of the 6-week sprint. Bring an idea, leave with a plan.", description: "The opening session of Huddle Season 1. Teams form, scopes lock, weekly demo cadence set. Online builders join on Google Meet; the campus crew meets in person.", starts_at: iso(now + 10 * D), ends_at: iso(now + 10 * D + 4 * H), registration_deadline: iso(now + 9 * D), capacity: 60,
      guests: [{ name: "Arjun Mehta", designation: "Staff Engineer", organization: "Razorpay", role: "mentor" }] },
    { ...base, ...VENUE, title: `${DEV_PREFIX} Hack Night — Week 2`, tagline: "Six hours. One feature. Ship it before midnight.", description: "Heads-down build session. Registration closes 24h before doors open, so this one shows the CLOSING SOON state.", starts_at: iso(now + 3 * D), ends_at: iso(now + 3 * D + 6 * H), registration_deadline: iso(now + 1 * D), capacity: 40 },
    { ...base, title: `${DEV_PREFIX} Weekly Build Sync (LIVE)`, tagline: "Happening now — share progress, unblock each other.", description: "The weekly online check-in. Started an hour ago, so this shows the LIVE state and registration is closed.", starts_at: iso(now - 1 * H), ends_at: iso(now + 3 * H), capacity: 100, venue_name: "Google Meet (online)", address: "meet.google.com", city: "Online", state: null, country: "India" },
    { ...base, ...VENUE, title: `${DEV_PREFIX} Founder Office Hours (small room)`, tagline: "One seat. Register, then check it from another account to see SOLD OUT.", description: "Capacity is 1. After you register, every other user sees the Sold out badge.", starts_at: iso(now + 6 * D), ends_at: iso(now + 6 * D + 2 * H), capacity: 1 },
    { ...base, title: `${DEV_PREFIX} Season 0 Retro (completed)`, tagline: "What we learned from the pilot cohort.", description: "A past event: COMPLETED badge, past filter, 'Thanks for building together' banner.", starts_at: iso(now - 7 * D), ends_at: iso(now - 7 * D + 3 * H), capacity: 50, venue_name: "Third Wave Coffee, Koramangala", address: "80 Feet Rd, Koramangala", city: "Bengaluru", state: "Karnataka", country: "India" },
    { ...base, title: `${DEV_PREFIX} Design Workshop (cancelled)`, tagline: "Cancelled — venue fell through.", description: "Shows the CANCELLED badge, greyscale cover, and the organizer's Re-publish action.", starts_at: iso(now + 5 * D), ends_at: iso(now + 5 * D + 3 * H), capacity: 30, status: "cancelled", venue_name: "WeWork Galaxy", address: "Residency Rd", city: "Bengaluru", state: "Karnataka", country: "India" },
    { ...base, title: `${DEV_PREFIX} Mumbai Meetup (draft)`, tagline: "Not published yet.", description: "A DRAFT: only you (organizer/admin) can see it. Test the draft banner and Publish now.", starts_at: iso(now + 45 * D), ends_at: iso(now + 45 * D + 4 * H), capacity: 80, status: "draft", venue_name: "TBD", address: "TBD", city: "Mumbai", state: "Maharashtra", country: "India" },
    { ...base, ...VENUE, title: `${DEV_PREFIX} Offline Finale — Bengaluru`, tagline: "Six weeks of building ends here. Demo what you shipped.", description: "The Season 1 finale. Every team presents, mentors give feedback, the community picks favourites.\n\nDoors 10:00 · Demos 11:00 · Lunch · Awards 16:00.", starts_at: iso(now + 42 * D), ends_at: iso(now + 42 * D + 8 * H), registration_deadline: iso(now + 40 * D), capacity: 150,
      guests: [
        { name: "Priya Nair", designation: "Founder", organization: "Scaler", role: "chief_guest" },
        { name: "Arjun Mehta", designation: "Staff Engineer", organization: "Razorpay", role: "mentor" },
        { name: "Sana Iqbal", designation: "Product Designer", organization: "Zomato", role: "speaker" },
        { name: "Dev Kapoor", designation: "Angel Investor", organization: "Independent", role: "judge" },
      ] },
  ];
}

const CHECKLIST: { title: string; steps: string[] }[] = [
  { title: "Joining as a builder", steps: [
    "Open /huddle → the Kickoff card shows 'Registration open'. Click View event → Register. Toast: \"You're in!\"",
    "Attendee list now shows you; 'Who's coming?' count went up; the event chat card unlocked → Open event chat.",
    "Cancel registration → confirm → badge returns to Register, chat locks again, count goes down.",
    "Hack Night shows 'Closing soon' (deadline < 48h). Weekly Build Sync shows 'Live now' and cannot be registered.",
    "Founder Office Hours has 1 seat. Register, then open it in a private window (or 2nd account) → 'Sold out'.",
    "Past filter shows Season 0 Retro as Completed. Cancelled workshop is greyed out with 'Cancelled'.",
  ] },
  { title: "Members talking to each other", steps: [
    "On an event you registered for, hover a builder in 'Who's coming?' → Message button → a DM opens in /chat.",
    "Open event chat → send a message → other members get a notification (check Inbox on a 2nd account).",
    "Builders in the huddle section on /huddle → Follow a builder → they get a follow notification.",
  ] },
  { title: "Organizer flows", steps: [
    "/huddle/manage lists all [DEV] events with Draft / Published / Cancelled filters.",
    "Open the draft → 'Publish now' banner → it appears on /huddle for everyone.",
    "Cancelled workshop → Re-publish. Any event → Edit → change title → chat title updates too.",
    "Attendees page (/huddle/<id>/attendees) → search, export CSV, mark no-shows.",
  ] },
];

function DevPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { roles, isOrganizer, isAdmin, loading: roleLoading, refresh } = useHuddleRole();
  const [migrated, setMigrated] = useState<boolean | null>(null);
  const [devEvents, setDevEvents] = useState<Pick<EventRow, "id" | "title" | "status" | "starts_at" | "registration_count" | "capacity">[]>([]);
  const [myRegs, setMyRegs] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);

  const probe = async () => {
    const { error } = await supabase.from("events").select("id", { head: true, count: "exact" });
    const ok = !error || !/schema cache|does not exist|Could not find/i.test(error.message);
    setMigrated(ok);
    if (!ok) return;
    const { data } = await supabase.from("events").select("id, title, status, starts_at, registration_count, capacity").like("title", `${DEV_PREFIX}%`).order("starts_at");
    setDevEvents(data ?? []);
    if (user) {
      const { data: regs } = await supabase.from("event_registrations").select("event_id").eq("user_id", user.id).eq("status", "registered");
      setMyRegs(new Set((regs ?? []).map((r) => r.event_id)));
    } else setMyRegs(new Set());
  };

  useEffect(() => { probe(); }, [user?.id]);

  if (!import.meta.env.DEV) {
    return (
      <HuddleShell>
        <div className="mx-auto max-w-3xl p-4 md:p-8">
          <EmptyState title="Dev tools are disabled in production." sub="Run the app with npm run dev to use this page." cta={<Link to="/huddle" className="brutal-btn text-xs">Back to Huddle</Link>} />
        </div>
      </HuddleShell>
    );
  }

  const run = async (key: string, fn: () => Promise<string>) => {
    setBusy(key);
    try {
      const msg = await fn();
      toast.success(msg);
    } catch (e) {
      toast.error(friendlyError((e as Error).message));
    } finally {
      setBusy(null);
      await probe();
    }
  };

  const createSeeds = () => run("create", async () => {
    if (!user) throw new Error("Sign in first");
    const seeds = buildSeeds(Date.now());
    let made = 0;
    for (const s of seeds) {
      const { guests, ...row } = s;
      const { data, error } = await supabase.from("events").insert({ ...row, organizer_id: user.id }).select("id").single();
      if (error) throw new Error(`${s.title}: ${error.message}`);
      if (guests?.length) {
        await supabase.from("event_guests").insert(guests.map((g, i) => ({ event_id: data.id, ...g, sort_order: i })));
      }
      made++;
    }
    return `Created ${made} [DEV] huddles`;
  });

  const registerAll = () => run("register", async () => {
    let n = 0;
    const skipped: string[] = [];
    for (const e of devEvents) {
      if (myRegs.has(e.id) || e.status !== "published") continue;
      const { error } = await supabase.rpc("register_for_event", { p_event_id: e.id });
      if (error) skipped.push(`${e.title.replace(DEV_PREFIX, "").trim()} (${friendlyError(error.message)})`);
      else n++;
    }
    if (skipped.length) toast(`Skipped: ${skipped.join(" · ")}`, { duration: 8000 });
    return `Registered for ${n} huddle${n === 1 ? "" : "s"}`;
  });

  const cancelAll = () => run("cancel", async () => {
    let n = 0;
    for (const e of devEvents) {
      if (!myRegs.has(e.id)) continue;
      const { error } = await supabase.rpc("cancel_event_registration", { p_event_id: e.id });
      if (!error) n++;
    }
    return `Cancelled ${n} registration${n === 1 ? "" : "s"}`;
  });

  const deleteAll = () => {
    if (!confirm(`Delete all ${devEvents.length} [DEV] huddles (and their registrations + chats)?`)) return;
    run("delete", async () => {
      const { error, count } = await supabase.from("events").delete({ count: "exact" }).like("title", `${DEV_PREFIX}%`);
      if (error) throw error;
      return `Deleted ${count ?? 0} [DEV] huddles`;
    });
  };

  const grantSql = `INSERT INTO public.user_roles (user_id, role)
SELECT id, r FROM public.profiles, unnest(ARRAY['huddle_admin','huddle_organizer']::public.app_role[]) AS r
WHERE username = '${profile?.username ?? "your_username"}'
ON CONFLICT DO NOTHING;`;

  const copy = async (text: string, label: string) => {
    try { await navigator.clipboard.writeText(text); toast.success(`${label} copied`); } catch { toast.error("Clipboard blocked — select and copy manually"); }
  };

  const loading = authLoading || roleLoading || migrated === null;

  return (
    <HuddleShell>
      <div className="mx-auto max-w-5xl p-4 pb-24 md:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="pill text-primary"><Beaker className="mr-1 h-3 w-3" /> developer testing</span>
          <span className="pill border-white/30 text-muted-foreground">local only · npm run dev</span>
        </div>
        <h1 className="mt-3 font-display text-4xl font-black uppercase leading-[0.9] tracking-tight md:text-5xl">Huddle dev tools</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Seed sample huddles, register yourself, and walk through the join / chat / organizer flows. Everything created here is prefixed <code className="text-primary">{DEV_PREFIX}</code> so it's easy to wipe.</p>

        <div className="mt-6"><HuddleNav /></div>

        {/* ------------------------------------------------------- status */}
        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <StatusTile ok={migrated} label="Migration applied" detail={migrated ? "events table found" : migrated === false ? "events table missing" : "checking…"} />
          <StatusTile ok={!!user} label="Signed in" detail={user ? `@${profile?.username ?? "…"}` : "sign in to test"} />
          <StatusTile ok={isOrganizer} label="Organizer role" detail={roles.length ? roles.join(", ") : loading ? "checking…" : "none"} />
        </section>

        {/* -------------------------------------------------- step 1: db */}
        {migrated === false && (
          <Step n="1" title="Apply the Huddle migration" tone="warn">
            <p>The Huddle tables don't exist in this Supabase project yet. Open the Supabase dashboard → SQL editor, paste the whole migration file and run it. It's idempotent.</p>
            <code className="mt-2 block border-2 border-white/15 bg-ink p-3 font-mono text-[11px]">supabase/migrations/20260922000000_add_huddle_events.sql</code>
            <button onClick={probe} className="brutal-btn mt-3 text-xs"><RefreshCw className="h-3.5 w-3.5" /> Re-check</button>
          </Step>
        )}

        {/* ------------------------------------------------ step 2: role */}
        {migrated && user && !isOrganizer && !roleLoading && (
          <Step n="2" title="Grant yourself the organizer role" tone="warn">
            <p>Creating huddles needs the <b>huddle_organizer</b> role, and only a <b>huddle_admin</b> can grant roles from the app. Bootstrap the first admin once by running this in the Supabase SQL editor:</p>
            <pre className="mt-2 overflow-x-auto border-2 border-white/15 bg-ink p-3 font-mono text-[11px] leading-relaxed">{grantSql}</pre>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => copy(grantSql, "SQL")} className="brutal-btn text-xs"><Copy className="h-3.5 w-3.5" /> Copy SQL</button>
              <button onClick={() => refresh().then(probe)} className="brutal-btn brutal-btn-ghost text-xs"><RefreshCw className="h-3.5 w-3.5" /> I ran it — re-check</button>
            </div>
          </Step>
        )}

        {migrated && !user && (
          <Step n="2" title="Sign in" tone="warn">
            <p>Sign in with the account you want to test as. The organizer account creates events; a second account (or a private window) is handy for testing the attendee side.</p>
            <Link to="/auth" className="brutal-btn mt-3 text-xs">Sign in</Link>
          </Step>
        )}

        {/* -------------------------------------------------- step 3: seed */}
        {migrated && user && isOrganizer && (
          <Step n="3" title="Seed & act" tone="ok">
            <div className="grid gap-2 sm:grid-cols-2">
              <ActionButton busy={busy === "create"} onClick={createSeeds} icon={<Rocket className="h-4 w-4" />} label="Create 8 sample huddles" sub="upcoming · closing soon · live · sold out · completed · cancelled · draft · finale" />
              <ActionButton busy={busy === "register"} onClick={registerAll} icon={<Ticket className="h-4 w-4" />} label="Register me for all open huddles" sub="uses the real register_for_event RPC" disabled={devEvents.length === 0} />
              <ActionButton busy={busy === "cancel"} onClick={cancelAll} icon={<XCircle className="h-4 w-4" />} label="Cancel my [DEV] registrations" sub="uses cancel_event_registration" ghost disabled={myRegs.size === 0} />
              <ActionButton busy={busy === "delete"} onClick={deleteAll} icon={<Trash2 className="h-4 w-4" />} label="Delete all [DEV] huddles" sub="cascades registrations, guests and chats" danger disabled={devEvents.length === 0} />
            </div>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Want other real profiles registered too (attendee lists, avatar stacks, group chats)? Run <b className="text-foreground">supabase/seed/huddle_dev_seed.sql</b> in the SQL editor instead — the browser can only register <i>you</i>.
            </p>
          </Step>
        )}

        {/* ------------------------------------------------ dev events */}
        {migrated && devEvents.length > 0 && (
          <section className="mt-8">
            <div className="flex items-end justify-between gap-2">
              <h2 className="font-display text-2xl font-black uppercase tracking-tight">[DEV] huddles <span className="text-primary">({devEvents.length})</span></h2>
              <Link to="/huddle/manage" className="font-mono text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Manage all →</Link>
            </div>
            <div className="brutal-card-flat mt-3 divide-y-2 divide-white/10">
              {devEvents.map((e) => (
                <div key={e.id} className="flex flex-wrap items-center gap-3 p-3">
                  <span className={`pill ${e.status === "published" ? "text-primary" : e.status === "draft" ? "text-muted-foreground" : "text-destructive"}`}>{e.status}</span>
                  <Link to="/huddle/$eventId" params={{ eventId: e.id }} className="min-w-0 flex-1 truncate text-sm font-bold hover:text-primary">{e.title.replace(DEV_PREFIX, "").trim()}</Link>
                  <span className="font-mono text-[10px] uppercase text-muted-foreground">{new Date(e.starts_at).toLocaleString()}</span>
                  <span className="font-mono text-[10px] uppercase text-muted-foreground">{e.registration_count}{e.capacity ? `/${e.capacity}` : ""} in</span>
                  {myRegs.has(e.id) && <span className="pill border-primary text-primary"><CheckCircle2 className="mr-1 h-3 w-3" /> you're in</span>}
                  <Link to="/huddle/$eventId" params={{ eventId: e.id }} className="brutal-btn brutal-btn-ghost px-2 py-1 text-[10px]"><ArrowUpRight className="h-3 w-3" /></Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ------------------------------------------------- checklist */}
        <section className="mt-10">
          <h2 className="flex items-center gap-2 font-display text-2xl font-black uppercase tracking-tight"><ClipboardList className="h-5 w-5 text-primary" /> Test checklist</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {CHECKLIST.map((c) => (
              <div key={c.title} className="huddle-feature p-4">
                <h3 className="font-display text-base font-black uppercase tracking-tight">{c.title}</h3>
                <ol className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
                  {c.steps.map((s, i) => (
                    <li key={i} className="flex gap-2"><span className="shrink-0 font-mono font-black text-primary">{String(i + 1).padStart(2, "0")}</span><span>{s}</span></li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
          {isAdmin && (
            <p className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> You're a Huddle admin: you can grant organizer to other users from /huddle/manage.</p>
          )}
        </section>
      </div>
    </HuddleShell>
  );
}

function StatusTile({ ok, label, detail }: { ok: boolean | null; label: string; detail: string }) {
  return (
    <div className={`flex items-center gap-3 border-2 p-3 ${ok ? "border-primary/60 bg-primary/5" : ok === false ? "border-destructive/60 bg-destructive/5" : "border-white/15"}`}>
      {ok === null ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : ok ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <XCircle className="h-5 w-5 text-destructive" />}
      <div className="min-w-0">
        <div className="font-mono text-[10px] font-black uppercase tracking-widest">{label}</div>
        <div className="truncate text-xs text-muted-foreground">{detail}</div>
      </div>
    </div>
  );
}

function Step({ n, title, tone, children }: { n: string; title: string; tone: "ok" | "warn"; children: React.ReactNode }) {
  return (
    <section className={`brutal-card-flat mt-6 p-5 ${tone === "warn" ? "border-primary/60" : "border-white/20"}`}>
      <div className="flex items-center gap-3">
        <span className="grid h-8 w-8 place-items-center border-2 border-white bg-primary font-display text-sm font-black text-primary-foreground" style={{ boxShadow: "2px 2px 0 0 #fff" }}>{n}</span>
        <h2 className="font-display text-xl font-black uppercase tracking-tight">{title}</h2>
      </div>
      <div className="mt-3 text-sm text-muted-foreground">{children}</div>
    </section>
  );
}

function ActionButton({ busy, onClick, icon, label, sub, ghost, danger, disabled }: { busy: boolean; onClick: () => void; icon: React.ReactNode; label: string; sub: string; ghost?: boolean; danger?: boolean; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={busy || disabled} className={`brutal-btn h-auto flex-col items-start gap-1 px-4 py-3 text-left normal-case tracking-normal disabled:cursor-not-allowed disabled:opacity-50 ${ghost ? "brutal-btn-ghost" : ""} ${danger ? "brutal-btn-danger" : ""}`}>
      <span className="flex items-center gap-2 text-sm font-black uppercase tracking-wide">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : icon} {label}</span>
      <span className="font-mono text-[10px] font-normal opacity-80">{sub}</span>
    </button>
  );
}
