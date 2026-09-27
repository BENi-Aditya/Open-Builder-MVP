import { computeEventState, STATE_META, type EventState, type EventStateInput } from "@/lib/huddle";
import { useNow } from "@/components/huddle/useNow";

export function EventStatusBadge({
  event,
  state: forced,
  size = "sm",
  className = "",
}: {
  event?: EventStateInput;
  state?: EventState;
  size?: "sm" | "md";
  className?: string;
}) {
  const now = useNow(30_000);
  const state = forced ?? (event ? computeEventState(event, now ?? new Date()) : "upcoming");
  const meta = STATE_META[state];
  const live = state === "live";
  return (
    <span
      className={`inline-flex items-center gap-1.5 border-2 font-mono font-black uppercase tracking-[0.14em] ${
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
      } ${meta.className} ${className}`}
      data-state={state}
    >
      {live && <span className="inline-block h-2 w-2 animate-pulse bg-white" />}
      {state === "closing_soon" && <span className="inline-block h-2 w-2 bg-black" />}
      {meta.label}
    </span>
  );
}
