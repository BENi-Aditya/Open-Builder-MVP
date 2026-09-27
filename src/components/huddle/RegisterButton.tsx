import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Check, Loader2, Ticket, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { canRegister, computeEventState, friendlyError, STATE_META, type EventStateInput } from "@/lib/huddle";
import { useNow } from "@/components/huddle/useNow";

export function RegisterButton({
  event,
  registered,
  onChange,
  size = "lg",
  className = "",
}: {
  event: EventStateInput & { id: string };
  registered: boolean;
  onChange?: (registered: boolean) => void | Promise<void>;
  size?: "md" | "lg";
  className?: string;
}) {
  const { user } = useAuth();
  const nav = useNavigate();
  const now = useNow(15_000);
  const [busy, setBusy] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const state = computeEventState(event, now ?? new Date());
  const sizeCls = size === "lg" ? "py-3 text-sm md:text-base" : "py-2 text-xs";

  const register = async () => {
    if (!user) {
      toast("Sign in to register for this huddle");
      nav({ to: "/auth" });
      return;
    }
    setBusy(true);
    const { error } = await supabase.rpc("register_for_event", { p_event_id: event.id });
    setBusy(false);
    if (error) return toast.error(friendlyError(error.message));
    toast.success("You're in! Welcome to the huddle.");
    await onChange?.(true);
  };

  const leave = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.rpc("cancel_event_registration", { p_event_id: event.id });
    setBusy(false);
    setConfirmLeave(false);
    if (error) return toast.error(friendlyError(error.message));
    toast("Registration cancelled");
    await onChange?.(false);
  };

  if (registered) {
    const canLeave = state !== "completed" && state !== "cancelled" && state !== "live";
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <div className={`brutal-btn w-full cursor-default justify-center border-white bg-black text-white ${sizeCls}`} style={{ boxShadow: "4px 4px 0 0 var(--primary)" }}>
          <Check className="h-4 w-4 text-primary" /> Registered ✓
        </div>
        {canLeave && !confirmLeave && (
          <button onClick={() => setConfirmLeave(true)} className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-destructive">
            can't make it? cancel registration
          </button>
        )}
        {confirmLeave && (
          <div className="flex gap-2">
            <button disabled={busy} onClick={leave} className="brutal-btn brutal-btn-danger flex-1 justify-center py-1.5 text-[10px]">
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />} Yes, cancel
            </button>
            <button onClick={() => setConfirmLeave(false)} className="brutal-btn brutal-btn-ghost flex-1 justify-center py-1.5 text-[10px]">Keep my spot</button>
          </div>
        )}
      </div>
    );
  }

  if (canRegister(state)) {
    return (
      <button disabled={busy} onClick={register} className={`brutal-btn w-full justify-center ${sizeCls} ${className}`}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ticket className="h-4 w-4" />} {busy ? "Registering…" : "Register now"}
      </button>
    );
  }

  const label =
    state === "full" ? "Sold out"
    : state === "completed" ? "Event completed"
    : state === "cancelled" ? "Event cancelled"
    : state === "live" ? "Event is live"
    : state === "upcoming" ? "Registration not open"
    : state === "draft" ? "Draft — not published"
    : STATE_META.registration_closed.label;

  return (
    <div className={`brutal-btn w-full cursor-not-allowed justify-center border-white/40 bg-black text-white/70 shadow-none ${sizeCls} ${className}`} aria-disabled>
      {label}
    </div>
  );
}
