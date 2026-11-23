// MiniFlix public Supabase client configuration.
(() => {
  const SUPABASE_URL = "https://oyvyumlhqdkxhinoawiw.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_JkxmYZts8EWkomQbqLVmRA_lM8eF6Js";
  if (!window.supabase?.createClient) {
    console.error("Supabase SDK failed to load.");
    return;
  }
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
  });
})();