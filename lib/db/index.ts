import { createClient } from "@/lib/supabase/client";
import { makeSupabaseDb } from "./supabase";
import { makeLocalDb } from "./local";
import type { DB } from "./types";

export type { DB } from "./types";

/**
 * Restituisce l'implementazione del service layer da usare lato browser:
 * Supabase se le env sono configurate, altrimenti il DB locale in memoria.
 */
export function getDb(): DB {
  const sb = createClient();
  if (sb) return makeSupabaseDb(sb);
  return makeLocalDb();
}
