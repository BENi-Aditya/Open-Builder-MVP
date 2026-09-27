import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { AppRole } from "@/lib/huddle";

export type HuddleRole = {
  roles: AppRole[];
  /** huddle_organizer, huddle_admin or openbuilder_admin */
  isOrganizer: boolean;
  /** huddle_admin or openbuilder_admin */
  isAdmin: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
};

/**
 * Frontend convenience only — every write is additionally enforced by RLS /
 * SECURITY DEFINER functions in the database.
 */
export function useHuddleRole(): HuddleRole {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    setRoles((data ?? []).map((r) => r.role));
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;
    setLoading(true);
    load();
  }, [user?.id, authLoading]);

  const isAdmin = roles.includes("huddle_admin") || roles.includes("openbuilder_admin");
  const isOrganizer = isAdmin || roles.includes("huddle_organizer");

  return { roles, isOrganizer, isAdmin, loading: loading || authLoading, refresh: load };
}
