import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env["SUPABASE_URL"] ?? "";
const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "";
const anonKey = process.env["SUPABASE_ANON_KEY"] ?? "";
const key = serviceKey || anonKey;

export const supabaseAdmin: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;
