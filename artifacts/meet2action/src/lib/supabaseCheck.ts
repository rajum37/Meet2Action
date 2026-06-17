// Connection health is checked server-side via GET /api/healthz
// This stub exists so old imports don't break during the transition.
export async function checkSupabaseConnection(): Promise<boolean> {
  return true
}
