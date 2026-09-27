import type { Database } from "@/integrations/supabase/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EventRow = Database["public"]["Tables"]["events"]["Row"];
export type EventGuest = Database["public"]["Tables"]["event_guests"]["Row"];
export type EventImage = Database["public"]["Tables"]["event_images"]["Row"];
export type EventRegistration = Database["public"]["Tables"]["event_registrations"]["Row"];
export type AppRole = Database["public"]["Enums"]["app_role"];

export type MiniProfile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export type HuddleEvent = EventRow & {
  organizer: MiniProfile;
  guests?: EventGuest[];
  images?: EventImage[];
};

export type Attendee = {
  id: string;
  user_id: string;
  registered_at: string;
  status: Database["public"]["Enums"]["event_registration_status"];
  user: MiniProfile;
};

export const EVENT_CARD_SELECT =
  "id, organizer_id, title, tagline, cover_image_url, starts_at, ends_at, timezone, registration_deadline, registration_enabled, capacity, venue_name, city, state, country, status, registration_count, chat_id, created_at, organizer:profiles!events_organizer_id_fkey(id, username, display_name, avatar_url)";

export const EVENT_DETAIL_SELECT =
  "*, organizer:profiles!events_organizer_id_fkey(id, username, display_name, avatar_url), guests:event_guests(*), images:event_images(*)";

export const GUEST_ROLES = ["mentor", "speaker", "chief_guest", "guest", "organizer", "panelist", "judge"] as const;
export type GuestRole = (typeof GUEST_ROLES)[number];

export const GUEST_ROLE_LABEL: Record<string, string> = {
  mentor: "Mentor",
  speaker: "Speaker",
  chief_guest: "Chief Guest",
  guest: "Guest",
  organizer: "Organizer",
  panelist: "Panelist",
  judge: "Judge",
};

// ---------------------------------------------------------------------------
// Event state (never stored — always derived from event data + current time)
// ---------------------------------------------------------------------------

export type EventState =
  | "draft"
  | "cancelled"
  | "completed"
  | "live"
  | "registration_closed"
  | "full"
  | "closing_soon"
  | "registration_open"
  | "upcoming";

export const CLOSING_SOON_MS = 48 * 60 * 60 * 1000;

export type EventStateInput = Pick<
  EventRow,
  "status" | "starts_at" | "ends_at" | "registration_deadline" | "registration_enabled" | "capacity" | "registration_count"
>;

export function registrationClosesAt(e: Pick<EventRow, "registration_deadline" | "starts_at">): Date {
  return new Date(e.registration_deadline ?? e.starts_at);
}

export function computeEventState(e: EventStateInput, now: Date = new Date()): EventState {
  if (e.status === "cancelled") return "cancelled";
  if (e.status === "draft") return "draft";
  const t = now.getTime();
  const starts = new Date(e.starts_at).getTime();
  const ends = new Date(e.ends_at).getTime();
  if (t >= ends) return "completed";
  if (t >= starts) return "live";
  if (!e.registration_enabled) return "upcoming";
  const closes = registrationClosesAt(e).getTime();
  if (t >= closes) return "registration_closed";
  if (e.capacity != null && e.registration_count >= e.capacity) return "full";
  if (closes - t <= CLOSING_SOON_MS) return "closing_soon";
  return "registration_open";
}

export const STATE_META: Record<EventState, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground border-white/30" },
  cancelled: { label: "Cancelled", className: "bg-destructive text-white border-white" },
  completed: { label: "Completed", className: "bg-black text-white/70 border-white/40" },
  live: { label: "Live now", className: "bg-[var(--citrus)] text-white border-white" },
  registration_closed: { label: "Registration closed", className: "bg-black text-white border-white" },
  full: { label: "Sold out", className: "bg-black text-primary border-primary" },
  closing_soon: { label: "Closing soon", className: "bg-primary text-primary-foreground border-white" },
  registration_open: { label: "Registration open", className: "bg-primary text-primary-foreground border-white" },
  upcoming: { label: "Upcoming", className: "bg-card text-foreground border-white" },
};

export function canRegister(state: EventState) {
  return state === "registration_open" || state === "closing_soon";
}

// ---------------------------------------------------------------------------
// Dates & timezones (no extra deps — Intl only)
// ---------------------------------------------------------------------------

export function getTimezones(): string[] {
  try {
    const anyIntl = Intl as unknown as { supportedValuesOf?: (k: string) => string[] };
    const list = anyIntl.supportedValuesOf?.("timeZone");
    if (list && list.length) return list;
  } catch {
    /* ignore */
  }
  return ["Asia/Kolkata", "UTC", "America/New_York", "America/Los_Angeles", "Europe/London", "Europe/Berlin", "Asia/Singapore", "Asia/Dubai", "Asia/Tokyo", "Australia/Sydney"];
}

export function browserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function tzOffsetMs(utcMs: number, tz: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(new Date(utcMs));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? "0");
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"));
  return asUtc - utcMs;
}

/** Convert a wall-clock date + time in an IANA timezone to a UTC ISO string. */
export function zonedToUtcIso(date: string, time: string, tz: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm, 0);
  let utc = guess - tzOffsetMs(guess, tz);
  // second pass handles DST boundaries
  utc = guess - tzOffsetMs(utc, tz);
  return new Date(utc).toISOString();
}

/** Split a UTC ISO string into wall-clock date + time in the given timezone (for form prefill). */
export function utcIsoToZoned(iso: string, tz: string): { date: string; time: string } {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const parts = dtf.formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour") === "24" ? "00" : get("hour")}:${get("minute")}` };
}

export function formatEventDate(iso: string, tz?: string, opts: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric",
    ...opts,
  }).format(new Date(iso));
}

export function formatEventTime(iso: string, tz?: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

export function formatEventTimeRange(startIso: string, endIso: string, tz?: string): string {
  return `${formatEventTime(startIso, tz)} – ${formatEventTime(endIso, tz)}`;
}

export function tzShortName(iso: string, tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" }).formatToParts(new Date(iso));
    return parts.find((p) => p.type === "timeZoneName")?.value ?? tz;
  } catch {
    return tz;
  }
}

export function sameDay(aIso: string, bIso: string, tz?: string) {
  const f = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
  return f(aIso) === f(bIso);
}

export type CountdownParts = { days: number; hours: number; minutes: number; seconds: number; total: number };

export function countdownParts(target: Date | string, now: Date = new Date()): CountdownParts {
  const total = Math.max(0, new Date(target).getTime() - now.getTime());
  const s = Math.floor(total / 1000);
  return {
    total,
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

// ---------------------------------------------------------------------------
// Location helpers
// ---------------------------------------------------------------------------

type LocationLike = Pick<EventRow, "venue_name" | "address" | "city" | "state" | "country" | "latitude" | "longitude" | "maps_url">;

export function fullAddress(e: Pick<LocationLike, "venue_name" | "address" | "city" | "state" | "country">, includeVenue = true): string {
  return [includeVenue ? e.venue_name : null, e.address, e.city, e.state, e.country].filter((s) => s && String(s).trim()).join(", ");
}

/** Google Maps navigation URL generated from stored location — never hard-coded. */
export function getDirectionsUrl(e: LocationLike): string {
  if (e.maps_url && /^https?:\/\//i.test(e.maps_url)) return e.maps_url;
  if (e.latitude != null && e.longitude != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${e.latitude},${e.longitude}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress(e))}`;
}

/** Key-less Google Maps embed for a lightweight preview. */
export function getMapEmbedUrl(e: LocationLike): string {
  const q = e.latitude != null && e.longitude != null ? `${e.latitude},${e.longitude}` : fullAddress(e);
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=15&output=embed`;
}

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

export const RPC_ERRORS: Record<string, string> = {
  not_authenticated: "Sign in to register.",
  event_not_found: "This huddle no longer exists.",
  event_not_open: "This huddle isn't open for registration.",
  registration_disabled: "Registration is disabled for this huddle.",
  registration_closed: "Registration has closed.",
  event_completed: "This huddle has already ended.",
  already_registered: "You're already registered.",
  event_full: "This huddle is sold out.",
  invalid_target: "You can't message yourself.",
  user_not_found: "Builder not found.",
};

export function friendlyError(message: string | undefined | null, fallback = "Something went wrong"): string {
  if (!message) return fallback;
  for (const key of Object.keys(RPC_ERRORS)) {
    if (message.includes(key)) return RPC_ERRORS[key];
  }
  return message;
}

export function eventStoragePath(eventId: string, kind: "cover" | "gallery" | "guests", file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  return `events/${eventId}/${kind}/${crypto.randomUUID()}.${ext}`;
}
