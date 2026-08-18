import { supabase } from "@/integrations/supabase/client";

export type AppNotificationType =
  | "follow"
  | "like"
  | "comment"
  | "collab_request"
  | "collab_accepted"
  | "build_log"
  | "chat_message";

type CreateNotificationInput = {
  userId: string;
  actorId?: string | null;
  type: AppNotificationType;
  entityId?: string | null;
  entityType?: string | null;
  body?: string | null;
  title?: string;
};

export async function requestBrowserPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }

  return Notification.requestPermission();
}

export async function createNotification({
  userId,
  actorId,
  type,
  entityId,
  entityType,
  body,
  title,
}: CreateNotificationInput) {
  if (!userId || userId === actorId) return null;

  const payload = {
    user_id: userId,
    actor_id: actorId ?? null,
    type,
    entity_id: entityId ?? null,
    entity_type: entityType ?? null,
    body: body ?? null,
    read: false,
  };

  const { data, error } = await supabase.from("notifications").insert(payload).select().single();
  if (error) {
    console.warn("Notification insert failed:", error.message);
    return null;
  }

  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    const shouldSkipBrowserAlert = document.visibilityState === "visible";
    if (!shouldSkipBrowserAlert) {
      new Notification(title ?? "New activity", {
        body: body || "You have a new notification",
        icon: "/logo.webp",
        tag: `${type}:${entityId ?? userId}`,
      });
    }
  }

  return data;
}