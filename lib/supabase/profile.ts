import { createClient } from "./client";

export type ProfileData = {
  name?: string;
  email?: string;
  sesso?: string;
  eta?: number;
  altezza?: number;
  peso?: number;
  massaGrassa?: number;
  attivita?: string;
  obiettivo?: string;
  allenamento?: string;
  condizioni?: string[];
  kcalObiettivo?: number;
  macro?: { proteine: number; carboidrati: number; grassi: number };
  archetipo?: string;
  assessmentDone?: boolean;
};

type ProfileRow = {
  id: string;
  name: string | null;
  email: string | null;
  sex: string | null;
  birthdate: string | null;
  eta: number | null;
  height_cm: number | null;
  peso: number | null;
  massa_grassa: number | null;
  attivita: string | null;
  obiettivo: string | null;
  allenamento: string | null;
  condizioni: string[] | null;
  kcal_obiettivo: number | null;
  macro_proteine: number | null;
  macro_carboidrati: number | null;
  macro_grassi: number | null;
  archetipo: string | null;
  assessment_done: boolean | null;
};

function rowToProfile(r: ProfileRow): ProfileData {
  return {
    name: r.name ?? undefined,
    email: r.email ?? undefined,
    sesso: r.sex === "F" ? "donna" : r.sex === "M" ? "uomo" : undefined,
    eta: r.eta ?? undefined,
    altezza: r.height_cm ?? undefined,
    peso: r.peso ?? undefined,
    massaGrassa: r.massa_grassa ?? undefined,
    attivita: r.attivita ?? undefined,
    obiettivo: r.obiettivo ?? undefined,
    allenamento: r.allenamento ?? undefined,
    condizioni: r.condizioni ?? [],
    kcalObiettivo: r.kcal_obiettivo ?? undefined,
    macro:
      r.macro_proteine != null
        ? {
            proteine: r.macro_proteine,
            carboidrati: r.macro_carboidrati ?? 0,
            grassi: r.macro_grassi ?? 0,
          }
        : undefined,
    archetipo: r.archetipo ?? undefined,
    assessmentDone: r.assessment_done ?? false,
  };
}

function profileToRow(p: ProfileData, uid: string) {
  return {
    id: uid,
    name: p.name,
    email: p.email,
    sex: p.sesso === "donna" ? "F" : p.sesso === "uomo" ? "M" : null,
    eta: p.eta,
    height_cm: p.altezza,
    peso: p.peso,
    massa_grassa: p.massaGrassa,
    attivita: p.attivita,
    obiettivo: p.obiettivo,
    allenamento: p.allenamento,
    condizioni: p.condizioni ?? [],
    kcal_obiettivo: p.kcalObiettivo,
    macro_proteine: p.macro?.proteine,
    macro_carboidrati: p.macro?.carboidrati,
    macro_grassi: p.macro?.grassi,
    archetipo: p.archetipo,
    assessment_done: p.assessmentDone ?? false,
  };
}

export async function getProfile(): Promise<ProfileData | null> {
  const sb = createClient();
  if (!sb) return null;
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (error || !data) return null;
  return rowToProfile(data as ProfileRow);
}

export async function upsertProfile(profile: ProfileData): Promise<void> {
  const sb = createClient();
  if (!sb) return;
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return;
  const row = profileToRow(profile, user.id);
  const { error } = await sb.from("profiles").upsert(row);
  if (error) throw error;
}
