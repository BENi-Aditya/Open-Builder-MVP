import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { s as supabase } from "./client-CZxeSKt5.mjs";
import { u as useAuth } from "./router-vnISQ9uA.mjs";
function FollowButton({ targetId, size = "md" }) {
  const { user } = useAuth();
  const [following, setFollowing] = reactExports.useState(false);
  const [loading, setLoading] = reactExports.useState(true);
  reactExports.useEffect(() => {
    if (!user || user.id === targetId) {
      setLoading(false);
      return;
    }
    supabase.from("follows").select("follower_id").eq("follower_id", user.id).eq("following_id", targetId).maybeSingle().then(({ data }) => {
      setFollowing(!!data);
      setLoading(false);
    });
  }, [user, targetId]);
  if (!user || user.id === targetId) return null;
  const toggle = async () => {
    if (following) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", targetId);
      setFollowing(false);
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: targetId });
      setFollowing(true);
    }
  };
  const sz = size === "sm" ? "text-[10px] py-1 px-2" : "";
  return /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: toggle, disabled: loading, className: `brutal-btn ${sz} ${following ? "brutal-btn-ghost" : ""}`, children: following ? "Following" : "Follow" });
}
export {
  FollowButton as F
};
