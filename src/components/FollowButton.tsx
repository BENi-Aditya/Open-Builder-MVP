import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { createNotification } from "@/lib/notifications";

export function FollowButton({ targetId, size = "md" }: { targetId: string; size?: "sm" | "md" }) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.id === targetId) { setLoading(false); return; }
    supabase.from("follows").select("follower_id").eq("follower_id", user.id).eq("following_id", targetId).maybeSingle()
      .then(({ data }) => { setFollowing(!!data); setLoading(false); });
  }, [user, targetId]);

  if (!user || user.id === targetId) return null;

  const toggle = async () => {
    if (following) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", targetId);
      setFollowing(false);
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: targetId });
      setFollowing(true);

      await createNotification({
        userId: targetId,
        actorId: user.id,
        type: "follow",
        entityId: user.id,
        entityType: "profile",
        body: `${user.user_metadata?.username || "Someone"} started following you`,
      });
    }
  };

  const sz = size === "sm" ? "text-[10px] py-1 px-2" : "";
  return (
    <button onClick={toggle} disabled={loading} className={`brutal-btn ${sz} ${following ? "brutal-btn-ghost" : ""}`}>
      {following ? "Following" : "Follow"}
    </button>
  );
}
