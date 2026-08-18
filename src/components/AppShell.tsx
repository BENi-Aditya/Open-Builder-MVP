import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import {
  Home, Compass, Users, Bell, Bookmark, Settings, Plus, LogOut, Hammer, Search, MessageSquare
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { requestBrowserPermission } from "@/lib/notifications";

const NAV = [
  { to: "/", label: "Feed", icon: Home },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/collab", label: "Collab", icon: Users },
  { to: "/notifications", label: "Inbox", icon: Bell },
  { to: "/chat", label: "Messages", icon: MessageSquare },
  { to: "/saved", label: "Saved", icon: Bookmark },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, profile, signOut } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();
  const [unread, setUnread] = useState(0);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!user) return;

    const promptNotifications = async () => {
      if (typeof window === "undefined") return;
      const hasPrompted = window.localStorage.getItem("openbuilder-notify-prompted") === "1";
      if (hasPrompted) return;

      window.localStorage.setItem("openbuilder-notify-prompted", "1");

      try {
        await requestBrowserPermission();
      } catch {
        // Browser may block the permission prompt; ignore silently.
      }
    };

    promptNotifications();

    const load = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      setUnread(count ?? 0);
    };
    load();
    const ch = supabase
      .channel("notif-shell")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { ch.unsubscribe(); };
  }, [user]);

  return (
    <div className="min-h-dvh grid-bg">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-dvh w-[260px] flex-col gap-4 overflow-y-auto border-r-2 border-white/10 p-5 md:flex">
        <Link to="/" className="flex items-center gap-2 mb-2">
          <img
            src="/logo.webp"
            alt="studojo"
            className="w-9 h-9 border-2 border-white object-cover"
            style={{ boxShadow: "3px 3px 0 0 #fff" }}
          />
          <div>
            <div className="font-display font-black text-lg leading-none">OPENBUILDER</div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">beta // build publicly</div>
          </div>
        </Link>

        <form
          onSubmit={(e) => { e.preventDefault(); if (q.trim()) nav({ to: "/explore", search: { q: q.trim() } as never }); }}
          className="relative"
        >
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="search builders, projects" className="brutal-input pl-8 text-xs" />
        </form>

        <nav className="flex flex-col gap-1">
          {NAV.map((n) => {
            const active = loc.pathname === n.to || (n.to !== "/" && loc.pathname.startsWith(n.to));
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center justify-between px-3 py-2 border-2 ${active ? "border-white bg-primary text-primary-foreground" : "border-transparent hover:border-white/30"}`}
                style={active ? { boxShadow: "3px 3px 0 0 #fff" } : {}}
              >
                <span className="flex items-center gap-3 font-bold uppercase text-xs tracking-wider">
                  <n.icon className="w-4 h-4" /> {n.label}
                </span>
                {n.to === "/notifications" && unread > 0 && (
                  <span className="pill bg-destructive text-white border-white">{unread}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <Link to="/new" className="brutal-btn justify-center mt-2">
          <Plus className="w-4 h-4" /> Ship a project
        </Link>

        <div className="mt-auto pt-4 border-t-2 border-white/10">
          {user && profile ? (
            <div className="space-y-2">
              <Link to="/u/$username" params={{ username: profile.username }} className="flex items-center gap-3 p-2 hover:bg-white/5">
                <Avatar profile={profile} size={36} />
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate">{profile.display_name || profile.username}</div>
                  <div className="text-xs text-muted-foreground font-mono truncate">@{profile.username}</div>
                </div>
              </Link>
              <div className="flex gap-1">
                <Link to="/settings" className="brutal-btn brutal-btn-ghost flex-1 text-[10px] py-1.5"><Settings className="w-3 h-3" /> Settings</Link>
                <button onClick={() => signOut()} className="brutal-btn brutal-btn-ghost text-[10px] py-1.5 px-2"><LogOut className="w-3 h-3" /></button>
              </div>
            </div>
          ) : (
            <Link to="/auth" className="brutal-btn w-full justify-center"><Hammer className="w-4 h-4" /> Join the builders</Link>
          )}
        </div>
      </aside>

      <main className="min-w-0 pb-[calc(5.25rem+env(safe-area-inset-bottom))] md:ml-[260px] md:pb-0">{children}</main>

      {/* mobile bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-6 border-t-2 border-white bg-card/95 px-1 pb-[max(env(safe-area-inset-bottom),0.35rem)] pt-1 backdrop-blur-sm md:hidden">
        {NAV.map((n) => {
          const active = loc.pathname === n.to || (n.to !== "/" && loc.pathname.startsWith(n.to));
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`flex min-h-14 flex-col items-center justify-center rounded-none border px-1 py-1 text-[9px] font-bold uppercase tracking-tight ${active ? "border-white bg-primary text-primary-foreground" : "border-transparent text-muted-foreground"}`}
            >
              <n.icon className="mb-0.5 h-4 w-4" />
              {n.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function Avatar({ profile, size = 32 }: { profile: { username: string; display_name?: string | null; avatar_url?: string | null } | null; size?: number }) {
  if (!profile) return <div style={{ width: size, height: size }} className="bg-muted border-2 border-white" />;
  if (profile.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={profile.username}
        style={{ width: size, height: size }}
        className="border-2 border-white object-cover"
      />
    );
  }
  const letter = (profile.display_name || profile.username || "?")[0].toUpperCase();
  const palette = ["bg-primary text-primary-foreground", "bg-[var(--grape)] text-white", "bg-[var(--tangerine)] text-black", "bg-[var(--sky)] text-black", "bg-[var(--citrus)] text-white"];
  const idx = (profile.username.charCodeAt(0) || 0) % palette.length;
  return (
    <div style={{ width: size, height: size, fontSize: size * 0.45 }} className={`${palette[idx]} border-2 border-white grid place-items-center font-black`}>
      {letter}
    </div>
  );
}
