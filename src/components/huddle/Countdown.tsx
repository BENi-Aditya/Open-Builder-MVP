import { computeEventState, countdownParts, registrationClosesAt, type EventStateInput } from "@/lib/huddle";
import { useNow } from "@/components/huddle/useNow";
import { Timer, Radio, Flag, Ban } from "lucide-react";

type Props = { event: EventStateInput; compact?: boolean };

/**
 * Live countdown that switches target automatically:
 *  - registration open      → "REGISTRATION CLOSES IN"
 *  - registration closed    → "EVENT STARTS IN"
 *  - live / completed / cancelled → static state banner
 */
export function Countdown({ event, compact = false }: Props) {
  const now = useNow(1000);

  if (!now) {
    return (
      <div className="brutal-card-flat p-5">
        <div className="h-3 w-40 animate-pulse bg-white/10" />
        <div className="mt-4 flex gap-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-16 w-[4.25rem] animate-pulse bg-white/10" />)}
        </div>
      </div>
    );
  }

  const state = computeEventState(event, now);

  if (state === "cancelled") return <Banner icon={<Ban className="h-5 w-5" />} title="Event cancelled" sub="This huddle isn't happening." tone="danger" />;
  if (state === "completed") return <Banner icon={<Flag className="h-5 w-5" />} title="Event completed" sub="Thanks for building together." tone="muted" />;
  if (state === "live") return <Banner icon={<Radio className="h-5 w-5 animate-pulse" />} title="Event is live" sub="Happening right now." tone="live" />;
  if (state === "draft") return <Banner icon={<Timer className="h-5 w-5" />} title="Draft" sub="Publish to start the countdown." tone="muted" />;

  const regOpen = state === "registration_open" || state === "closing_soon" || state === "full";
  const target = regOpen ? registrationClosesAt(event) : new Date(event.starts_at);
  const heading = regOpen ? "Registration closes in" : "Event starts in";
  const parts = countdownParts(target, now);
  const showSeconds = parts.days === 0;

  return (
    <div className={`brutal-card-flat relative overflow-hidden ${compact ? "p-4" : "p-5 md:p-6"}`}>
      <div className="huddle-dots pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative">
        <div className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-primary">
          <Timer className="h-3.5 w-3.5" /> {heading}
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-2 md:gap-3">
          <Digit value={parts.days} label="days" />
          <Digit value={parts.hours} label="hours" />
          <Digit value={parts.minutes} label="minutes" />
          {showSeconds && <Digit value={parts.seconds} label="seconds" />}
        </div>
        {!regOpen && state === "registration_closed" && (
          <div className="mt-3 inline-flex border-2 border-white bg-black px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-widest">
            Registration closed
          </div>
        )}
        {!regOpen && state === "upcoming" && (
          <div className="mt-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Registration isn't open yet.</div>
        )}
      </div>
    </div>
  );
}

function Digit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="countdown-digit">{String(value).padStart(2, "0")}</div>
      <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
    </div>
  );
}

function Banner({ icon, title, sub, tone }: { icon: React.ReactNode; title: string; sub: string; tone: "danger" | "muted" | "live" }) {
  const cls =
    tone === "danger"
      ? "bg-destructive text-white border-white"
      : tone === "live"
        ? "bg-primary text-primary-foreground border-white"
        : "bg-black text-white border-white/40";
  return (
    <div className={`border-2 p-5 shadow-[6px_6px_0_0_#fff] ${cls}`}>
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <div className="font-display text-2xl font-black uppercase leading-none tracking-tight">{title}</div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-widest opacity-80">{sub}</div>
        </div>
      </div>
    </div>
  );
}
