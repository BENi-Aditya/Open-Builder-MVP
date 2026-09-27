import { Link } from "@tanstack/react-router";
import { ArrowUpRight, CalendarDays, Clock, MapPin, Users } from "lucide-react";
import { Avatar } from "@/components/AppShell";
import { EventStatusBadge } from "@/components/huddle/EventStatusBadge";
import { AttendeeAvatars } from "@/components/huddle/AttendeeAvatars";
import { formatEventTimeRange, type HuddleEvent, type MiniProfile } from "@/lib/huddle";

export function EventCard({
  event,
  attendeePreview = [],
  manage = false,
}: {
  event: HuddleEvent;
  attendeePreview?: MiniProfile[];
  manage?: boolean;
}) {
  const start = new Date(event.starts_at);
  const day = new Intl.DateTimeFormat("en-GB", { day: "2-digit", timeZone: event.timezone }).format(start);
  const month = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: event.timezone }).format(start);
  const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: event.timezone }).format(start);
  const place = [event.city, event.state].filter(Boolean).join(", ");
  const isCancelled = event.status === "cancelled";

  return (
    <article className={`brutal-card group flex h-full w-full flex-col overflow-hidden bg-card ${isCancelled ? "opacity-80" : ""}`}>
      {/* Cover */}
      <Link to="/huddle/$eventId" params={{ eventId: event.id }} className="relative block overflow-hidden">
        <div className="relative h-52 bg-ink sm:h-56">
          <div className="absolute inset-0 grid-bg opacity-20" />
          {event.cover_image_url ? (
            <img
              src={event.cover_image_url}
              alt={event.title}
              className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${isCancelled ? "grayscale" : ""}`}
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-primary/30 via-transparent to-[var(--grape)]/20">
              <span className="select-none font-display text-7xl font-black text-white/10">{event.title[0]?.toUpperCase()}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute inset-0 scan-noise opacity-10" />

          {/* date stub */}
          <div className="absolute left-3 top-3 border-2 border-white bg-primary text-primary-foreground shadow-[3px_3px_0_0_#fff]">
            <div className="px-2.5 pt-1.5 text-center font-display text-3xl font-black leading-none">{day}</div>
            <div className="border-t-2 border-black/20 px-2 pb-1 text-center font-mono text-[9px] font-black uppercase tracking-widest">
              {month} · {weekday}
            </div>
          </div>

          <div className="absolute right-3 top-3">
            <EventStatusBadge event={event} />
          </div>

          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
            <div className="flex items-center gap-1.5 border-2 border-white/70 bg-black/70 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
              <MapPin className="h-3 w-3 text-primary" /> {place || event.country}
            </div>
          </div>
        </div>
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <Link to="/huddle/$eventId" params={{ eventId: event.id }}>
            <h3 className="font-display text-2xl font-black uppercase leading-[0.95] tracking-tight hover:text-primary">{event.title}</h3>
          </Link>
          {event.tagline && <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{event.tagline}</p>}
        </div>

        <div className="grid grid-cols-1 gap-1.5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground sm:grid-cols-2">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-primary" />
            {new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "long", year: "numeric", timeZone: event.timezone }).format(start)}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-primary" />
            {formatEventTimeRange(event.starts_at, event.ends_at, event.timezone)}
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t-2 border-white/10 pt-3">
          <div className="flex min-w-0 items-center gap-2">
            {attendeePreview.length > 0 ? (
              <AttendeeAvatars attendees={attendeePreview} total={event.registration_count} max={4} size={26} linkable={false} />
            ) : (
              <Users className="h-4 w-4 text-primary" />
            )}
            <span className="truncate font-mono text-[10px] font-bold uppercase tracking-wider">
              {event.registration_count} attending{event.capacity ? ` / ${event.capacity}` : ""}
            </span>
          </div>
          <Link
            to={manage ? "/huddle/$eventId/edit" : "/huddle/$eventId"}
            params={{ eventId: event.id }}
            className="brutal-btn shrink-0 px-3 py-1.5 text-[10px]"
          >
            {manage ? "Edit" : "View event"} <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
          <Avatar profile={event.organizer} size={18} />
          <span className="truncate">hosted by <b className="text-foreground">{event.organizer.display_name || event.organizer.username}</b></span>
        </div>
      </div>
    </article>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="brutal-card-flat flex h-full flex-col overflow-hidden">
      <div className="h-52 animate-pulse bg-white/5 sm:h-56" />
      <div className="space-y-3 p-4">
        <div className="h-7 w-3/4 animate-pulse bg-white/10" />
        <div className="h-4 w-full animate-pulse bg-white/5" />
        <div className="h-4 w-2/3 animate-pulse bg-white/5" />
        <div className="flex justify-between pt-3">
          <div className="h-6 w-28 animate-pulse bg-white/5" />
          <div className="h-8 w-24 animate-pulse bg-primary/30" />
        </div>
      </div>
    </div>
  );
}
