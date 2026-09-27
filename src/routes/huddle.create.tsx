import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useHuddleRole } from "@/hooks/use-huddle-role";
import { HuddleShell } from "@/components/huddle/HuddleShell";
import { EventForm } from "@/components/huddle/EventForm";
import { EmptyState, OrganizerOnly } from "@/components/huddle/States";

export const Route = createFileRoute("/huddle/create")({
  component: CreateEventPage,
  head: () => ({ meta: [{ title: "Create a huddle — OpenBuilder × Huddle" }] }),
});

function CreateEventPage() {
  const { user, loading: authLoading } = useAuth();
  const { isOrganizer, loading } = useHuddleRole();
  const nav = useNavigate();

  return (
    <HuddleShell>
      <div className="mx-auto max-w-3xl p-4 pb-24 md:p-8">
        <Link to="/huddle" className="mb-4 inline-flex items-center gap-1.5 font-mono text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-3 w-3" /> back to huddle
        </Link>

        {authLoading || loading ? (
          <div className="brutal-card-flat p-8 text-center font-mono text-xs uppercase text-muted-foreground animate-pulse">checking permissions…</div>
        ) : !user ? (
          <EmptyState title="Sign in first." sub="Only Huddle organizers can create events." cta={<Link to="/auth" className="brutal-btn text-xs">Sign in</Link>} />
        ) : !isOrganizer ? (
          <OrganizerOnly />
        ) : (
          <>
            <header className="brutal-card-flat relative mb-6 overflow-hidden p-5 md:p-6">
              <div className="grid-bg absolute inset-0 opacity-30" />
              <div className="huddle-stripes absolute -right-8 -top-8 h-32 w-32 rotate-12 opacity-25" />
              <div className="relative">
                <span className="pill text-primary">// new huddle</span>
                <h1 className="mt-2 font-display text-3xl font-black uppercase leading-none tracking-tight md:text-4xl">Put builders in a room.</h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Save a draft while you gather details. Publishing makes the event visible on Huddle and opens registration.</p>
              </div>
            </header>
            <EventForm mode="create" onSaved={(id) => nav({ to: "/huddle/$eventId", params: { eventId: id } })} />
          </>
        )}
      </div>
    </HuddleShell>
  );
}
