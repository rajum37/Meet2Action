import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = process.env['SUPABASE_URL'] ?? ''
const key = process.env['SUPABASE_ANON_KEY'] ?? ''

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: SupabaseClient<any> | null =
  url && key ? createClient(url, key) : null
