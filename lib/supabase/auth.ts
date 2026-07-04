import { createClient } from "./client";

export async function signUp(email: string, password: string) {
  const sb = createClient();
  if (!sb) throw new Error("Supabase non configurato");
  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const sb = createClient();
  if (!sb) throw new Error("Supabase non configurato");
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const sb = createClient();
  if (!sb) return;
  await sb.auth.signOut();
}

export async function getUser() {
  const sb = createClient();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data.user;
}

export async function resetPassword(email: string) {
  const sb = createClient();
  if (!sb) throw new Error("Supabase non configurato");
  const { error } = await sb.auth.resetPasswordForEmail(email);
  if (error) throw error;
}

export function onAuthStateChange(cb: (user: unknown) => void) {
  const sb = createClient();
  if (!sb) return { unsubscribe: () => {} };
  const { data } = sb.auth.onAuthStateChange((_event, session) => {
    cb(session?.user ?? null);
  });
  return { unsubscribe: () => data.subscription.unsubscribe() };
}
