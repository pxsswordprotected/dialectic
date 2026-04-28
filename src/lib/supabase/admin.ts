import "server-only";
import { createClient } from "@supabase/supabase-js";

// SERVER-ONLY. Never import this from a client component.
// Uses the service-role key which bypasses RLS.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
