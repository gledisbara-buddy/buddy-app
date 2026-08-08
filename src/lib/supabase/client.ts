import { createBrowserClient } from "@supabase/ssr";

// Appen är helt klientdriven (ingen server-side rendering beror på
// inloggning), så en enda browser-klient räcker — `createBrowserClient`
// returnerar samma instans vid upprepade anrop (isSingleton är på som
// standard) och sköter sessionslagring/token-refresh automatiskt.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
