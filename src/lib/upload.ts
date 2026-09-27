import { supabase } from "@/integrations/supabase/client";

export async function uploadMedia(file: File, userId: string, folder = "uploads"): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Event assets live under `events/{eventId}/{cover|gallery|guests}/…` in the same
 * public `media` bucket. Storage RLS only lets Huddle organizers/admins write there.
 */
export async function uploadEventMedia(file: File, eventId: string, kind: "cover" | "gallery" | "guests"): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `events/${eventId}/${kind}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}
