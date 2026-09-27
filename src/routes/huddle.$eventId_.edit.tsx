import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ClipboardList, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useHuddleRole } from "@/hooks/use-huddle-role";
import { HuddleShell } from "@/components/huddle/HuddleShell";
import { EventForm } from "@/components/huddle/EventForm";
import { EventStatusBadge } from "@/components/huddle/EventStatusBadge";
import { EmptyState, OrganizerOnly } from "@/components/huddle/States";
import { EVENT_DETAIL_SELECT, type HuddleEvent } from "@/lib/huddle";

export const Route = createFileRoute("/huddle/$eventId_/edit")({
  component: EditEventPage,
  head: () => ({ meta: [{ title: "Edit huddle — OpenBuilder × Huddle" }] }),
});

function EditEventPage() {
  const { eventId } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useHuddleRole();
  const nav = useNavigate();
  const [event, setEvent] = useState<HuddleEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("events").select(EVENT_DETAIL_SELECT).eq("id", eventId).maybeSingle();
      setEvent((data as unknown as HuddleEvent) ?? null);
      setLoading(false);
    })();
  }, [eventId, user?.id, authLoading]);

  const canEdit = !!user && !!event && (event.organizer_id === user.id || isAdmin);

  return (
    <HuddleShell>
      <div className="mx-auto max-w-3xl p-4 pb-24 md:p-8">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Link to="/huddle/manage" className="inline-flex items-center gap-1.5 font-mono text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-3 w-3" /> manage events
          </Link>
          {event && canEdit && (
            <div className="ml-auto flex gap-2">
              <Link to="/huddle/$eventId" params={{ eventId }} className="brutal-btn brutal-btn-ghost px-3 py-1.5 text-[10px]"><Eye className="h-3 w-3" /> View</Link>
              <Link to="/huddle/$eventId/attendees" params={{ eventId }} className="brutal-btn brutal-btn-ghost px-3 py-1.5 text-[10px]"><ClipboardList className="h-3 w-3" /> Attendees</Link>
            </div>
          )}
        </div>

        {authLoading || roleLoading || loading ? (
          <div className="space-y-4">
            <div className="h-24 animate-pulse bg-white/5" />
            <div className="h-64 animate-pulse bg-white/5" />
            <div className="h-48 animate-pulse bg-white/5" />
          </div>
        ) : !user ? (
          <EmptyState title="Sign in first." sub="Only the event organizer can edit this huddle." cta={<Link to="/auth" className="brutal-btn text-xs">Sign in</Link>} />
        ) : !event ? (
          <EmptyState title="Huddle not found." sub="It may have been removed, or you don't have access." cta={<Link to="/huddle" className="brutal-btn text-xs">Back to huddles</Link>} />
        ) : !canEdit ? (
          <OrganizerOnly />
        ) : (
          <>
            <header className="brutal-card-flat relative mb-6 overflow-hidden p-5 md:p-6">
              <div className="grid-bg absolute inset-0 opacity-30" />
              <div className="relative flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="pill text-primary">// edit huddle</span>
                  <h1 className="mt-2 font-display text-3xl font-black uppercase leading-none tracking-tight">{event.title}</h1>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {event.registration_count} registered{event.capacity ? ` / ${event.capacity}` : ""} · attendees are notified when time or venue changes
                  </p>
                </div>
                <EventStatusBadge event={event} size="md" />
              </div>
            </header>
            <EventForm mode="edit" initial={event} onSaved={(id) => nav({ to: "/huddle/$eventId", params: { eventId: id } })} />
          </>
        )}
      </div>
    </HuddleShell>
  );
}
