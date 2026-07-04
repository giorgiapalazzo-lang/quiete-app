import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase lato browser. Usa le env pubbliche.
 * Ritorna null se le env non sono configurate, così la UI può fare
 * fallback sul DB locale in memoria finché Supabase non è collegato.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return createBrowserClient(url, anon);
}

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
