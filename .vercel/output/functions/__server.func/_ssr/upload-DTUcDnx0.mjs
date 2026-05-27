import { s as supabase } from "./client-BkH9hjXP.mjs";
async function uploadMedia(file, userId, folder = "uploads") {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}
export {
  uploadMedia as u
};
