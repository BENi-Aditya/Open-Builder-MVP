import { Link } from "@tanstack/react-router";
import { ArrowLeft, Flame, RefreshCw, ShieldAlert } from "lucide-react";

export function EmptyState({ title, sub, cta }: { title: string; sub: string; cta?: React.ReactNode }) {
  return (
    <div className="brutal-card mt-6 bg-card p-10 text-center md:p-14" style={{ boxShadow: "8px 8px 0 0 var(--primary)" }}>
      <div className="mx-auto mb-5 grid h-16 w-16 rotate-3 place-items-center border-2 border-primary bg-primary/10">
        <Flame className="h-8 w-8 text-primary" />
      </div>
      <h2 className="font-display text-2xl font-black uppercase tracking-tight md:text-3xl">{title}</h2>
      <p className="mx-auto mt-2 max-w-md font-mono text-xs uppercase leading-relaxed tracking-wider text-muted-foreground">{sub}</p>
      {cta && <div className="mt-6 flex justify-center">{cta}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const isMissingTable = /relation .* does not exist|schema cache|Could not find the table/i.test(message);
  return (
    <div className="brutal-card-flat mt-6 border-destructive p-8 text-center">
      <h2 className="font-display text-xl font-black uppercase text-destructive">Couldn't load huddles</h2>
      <p className="mt-2 font-mono text-xs text-muted-foreground">
        {isMissingTable ? "The Huddle database migration hasn't been applied yet (supabase/migrations/20260922000000_add_huddle_events.sql)." : message}
      </p>
      <button onClick={onRetry} className="brutal-btn mt-4 text-xs"><RefreshCw className="h-3.5 w-3.5" /> Retry</button>
    </div>
  );
}

export function OrganizerOnly() {
  return (
    <div className="brutal-card-flat border-destructive/60 p-8 text-center md:p-12">
      <div className="mx-auto mb-4 grid h-14 w-14 -rotate-3 place-items-center border-2 border-destructive bg-destructive/10">
        <ShieldAlert className="h-7 w-7 text-destructive" />
      </div>
      <h1 className="font-display text-2xl font-black uppercase tracking-tight">Organizers only.</h1>
      <p className="mx-auto mt-2 max-w-md font-mono text-xs uppercase leading-relaxed tracking-wider text-muted-foreground">
        Creating and editing huddles requires the Huddle organizer role. Ask a Huddle admin to grant you access.
      </p>
      <Link to="/huddle" className="brutal-btn mt-6 text-xs"><ArrowLeft className="h-3.5 w-3.5" /> Back to huddles</Link>
    </div>
  );
}
