import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { HuddleShell } from "@/components/huddle/HuddleShell";
import { EmptyState } from "@/components/huddle/States";

/**
 * /huddle/:eventId/chat — resolves the event's group chat and hands off to the
 * existing Messages UI (/chat?id=…). Access is enforced by chat RLS: only
 * registered attendees / organizers are chat participants.
 */
export const Route = createFileRoute("/huddle/$eventId_/chat")({
  component: EventChatRedirect,
});

function EventChatRedirect() {
  const { eventId } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [state, setState] = useState<"loading" | "locked" | "missing">("loading");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setState("locked"); return; }
    (async () => {
      const { data: ev } = await supabase.from("events").select("id, chat_id").eq("id", eventId).maybeSingle();
      if (!ev) return setState("missing");
      if (!ev.chat_id) return setState("locked");
      const { data: member } = await supabase.from("chat_participants").select("chat_id").eq("chat_id", ev.chat_id).eq("user_id", user.id).maybeSingle();
      if (!member) return setState("locked");
      nav({ to: "/chat", search: { id: ev.chat_id }, replace: true });
    })();
  }, [eventId, user?.id, authLoading]);

  return (
    <HuddleShell>
      <div className="mx-auto max-w-2xl p-6 md:p-10">
        {state === "loading" ? (
          <div className="brutal-card-flat flex items-center justify-center gap-3 p-10 font-mono text-xs uppercase text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" /> opening event chat…
          </div>
        ) : state === "missing" ? (
          <EmptyState title="Huddle not found." sub="This event doesn't exist or isn't visible to you." cta={<Link to="/huddle" className="brutal-btn text-xs">Back to huddles</Link>} />
        ) : (
          <EmptyState
            title="Event chat is locked."
            sub="Only registered attendees and organizers can join the group chat. Register first."
            cta={
              <div className="flex gap-2">
                {!user && <Link to="/auth" className="brutal-btn text-xs">Sign in</Link>}
                <Link to="/huddle/$eventId" params={{ eventId }} className="brutal-btn brutal-btn-ghost text-xs"><Lock className="h-3.5 w-3.5" /> Go to event</Link>
              </div>
            }
          />
        )}
      </div>
    </HuddleShell>
  );
}
