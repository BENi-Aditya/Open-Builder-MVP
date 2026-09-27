import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Flame, Plus, LayoutList, Ticket, Beaker } from "lucide-react";
import { useHuddleRole } from "@/hooks/use-huddle-role";
import { useAuth } from "@/lib/auth-context";

/** Applies the Huddle (orange) theme to everything rendered inside. */
export function HuddleShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`huddle-theme min-h-dvh ${className}`}>{children}</div>;
}

/** Sub-navigation shown on the Huddle landing / manage pages. */
export function HuddleNav() {
  const loc = useLocation();
  const { user } = useAuth();
  const { isOrganizer } = useHuddleRole();
  const path = loc.pathname.replace(/\/$/, "");
  const tab = (loc.search as { tab?: string } | undefined)?.tab;

  const tabs: { to: string; search?: Record<string, string>; label: string; icon: typeof Flame; active: boolean }[] = [
    { to: "/huddle", label: "Discover", icon: Flame, active: path === "/huddle" && tab !== "mine" },
  ];
  if (user) tabs.push({ to: "/huddle", search: { tab: "mine" }, label: "My huddles", icon: Ticket, active: path === "/huddle" && tab === "mine" });
  if (isOrganizer) tabs.push({ to: "/huddle/manage", label: "Manage", icon: LayoutList, active: path.startsWith("/huddle/manage") });
  if (import.meta.env.DEV) tabs.push({ to: "/huddle/dev", label: "Dev", icon: Beaker, active: path.startsWith("/huddle/dev") });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tabs.map((t) => (
        <Link
          key={t.label}
          to={t.to}
          search={(t.search ?? {}) as never}
          className={`flex items-center gap-2 border-2 px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-widest transition-colors ${
            t.active ? "border-white bg-primary text-primary-foreground shadow-[3px_3px_0_0_#fff]" : "border-white/20 text-muted-foreground hover:border-white/60 hover:text-foreground"
          }`}
        >
          <t.icon className="h-3.5 w-3.5" /> {t.label}
        </Link>
      ))}
      {isOrganizer && (
        <Link to="/huddle/create" className="brutal-btn ml-auto px-3 py-1.5 text-[10px]">
          <Plus className="h-3.5 w-3.5" /> Create event
        </Link>
      )}
    </div>
  );
}
