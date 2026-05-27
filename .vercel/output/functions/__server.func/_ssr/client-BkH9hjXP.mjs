import { c as createClient } from "../_libs/supabase__supabase-js.mjs";
function createSupabaseClient() {
  const SUPABASE_URL = "https://xypwkophnbcimzbsvein.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5cHdrb3BobmJjaW16YnN2ZWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MDczMTcsImV4cCI6MjA5NTM4MzMxN30.dtkpAmvJvWchlcV5ohCAeA-56PDTTAj9i6belkU4LRU";
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: typeof window !== "undefined" ? window.localStorage : void 0,
      persistSession: true,
      autoRefreshToken: true
    }
  });
}
const supabase = createSupabaseClient();
export {
  supabase as s
};
