// ============================================================================
// Motore nutrizionale di Quiete — calcolo di fabbisogno energetico e macros.
//
// Calibrato su docs/clinical-dietetics-reference.md (ricerca "Clinical Dietetics
// Workflow": ISSN, EFSA, ACSM, ESPEN, AND/ANDID, Academy of Nutrition & Dietetics).
// Ogni numero qui traccia a una riga di quel documento — NON semplificare senza
// aggiornare anche il riferimento.
//
// IMPORTANTE (legale + prodotto): genera uno *schema orientativo*, non una
// prescrizione (in Italia atto riservato a medico/biologo/dietista). La UI mostra
// sempre il disclaimer e la CTA verso i nutrizionisti del team.
// ============================================================================

export type Sesso = "uomo" | "donna";

export type LivelloAttivita =
  | "sedentario"
  | "leggero"
  | "moderato"
  | "attivo"
  | "molto_attivo";

// §2 — moltiplicatori PAL (BMR × fattore).
export const MOLTIPLICATORI_ATTIVITA: Record<LivelloAttivita, number> = {
  sedentario: 1.2,
  leggero: 1.375,
  moderato: 1.55,
  attivo: 1.725,
  molto_attivo: 1.9,
};

const ORDINE_ATTIVITA: LivelloAttivita[] = [
  "sedentario",
  "leggero",
  "moderato",
  "attivo",
  "molto_attivo",
];

/**
 * §2 — Correzione sovrastima attività. La ricerca mostra che le persone
 * sovrastimano l'attività fisica in media del 51%: in onboarding si usa un
 * livello più basso dell'auto-dichiarato (floor: sedentario).
 */
export function correggiAttivita(a: LivelloAttivita): LivelloAttivita {
  const i = ORDINE_ATTIVITA.indexOf(a);
  return ORDINE_ATTIVITA[Math.max(0, i - 1)];
}

export type Obiettivo =
  | "dimagrimento"
  | "mantenimento"
  | "massa"
  | "ricomposizione"
  | "salute_intestinale";

export type TipoAllenamento = "nessuno" | "forza" | "cardio" | "misto";

export type ProfiloNutrizionale = {
  sesso: Sesso;
  eta: number;
  altezzaCm: number;
  pesoKg: number;
  attivita: LivelloAttivita;
  obiettivo: Obiettivo;
  allenamento?: TipoAllenamento; // default "nessuno"
  massaGrassaPct?: number; // se nota (BIA/plica) → Katch-McArdle
  condizioni?: string[]; // per aggiustamenti clinici (menopausa, gravidanza…)
};

export type Macro = { proteine: number; carboidrati: number; grassi: number }; // g/giorno

export type OpzioniSchema = {
  // §2 — applica la correzione attività di un livello (default true).
  correzioneAttivita?: boolean;
  // §5/§6 — forma la ripartizione carbo/grassi secondo l'archetipo scelto.
  archetipoMacroPct?: { proteine: number; carboidrati: number; grassi: number };
};

export type RisultatoNutrizionale = {
  bmr: number;
  metodoBmr: "mifflin" | "katch"; // formula usata
  tdee: number; // con attività (eventualmente corretta)
  attivitaUsata: LivelloAttivita;
  kcalObiettivo: number;
  deltaKcal: number;
  macro: Macro;
  percentuali: { proteine: number; carboidrati: number; grassi: number };
  proteineGkg: number;
  ritmoStimatoKgSettimana: number;
  note: string[];
};

const KCAL_PER_G = { proteine: 4, carboidrati: 4, grassi: 9 } as const;

/**
 * §1 — BMR/REE.
 * Default Mifflin-St Jeor (ADA 2005: più accurato per popolazioni moderne).
 * Katch-McArdle (370 + 21.6·LBM) quando è nota la % massa grassa: più preciso
 * per chi è magro/muscoloso, dove Mifflin sottostima.
 */
export function calcolaBMR(
  p: Pick<ProfiloNutrizionale, "sesso" | "eta" | "altezzaCm" | "pesoKg" | "massaGrassaPct">,
): { bmr: number; metodo: "mifflin" | "katch" } {
  if (p.massaGrassaPct != null && p.massaGrassaPct > 3 && p.massaGrassaPct < 60) {
    const lbm = p.pesoKg * (1 - p.massaGrassaPct / 100);
    return { bmr: Math.round(370 + 21.6 * lbm), metodo: "katch" };
  }
  const base = 10 * p.pesoKg + 6.25 * p.altezzaCm - 5 * p.eta;
  return { bmr: Math.round(base + (p.sesso === "uomo" ? 5 : -161)), metodo: "mifflin" };
}

/** §2 — TDEE = BMR × moltiplicatore attività. */
export function calcolaTDEE(bmr: number, attivita: LivelloAttivita): number {
  return Math.round(bmr * MOLTIPLICATORI_ATTIVITA[attivita]);
}

/**
 * §3 — Aggiustamento calorico per obiettivo.
 * - Dimagrimento: −20% del TDEE (banda conservativa −10…−20%; ~0.5–1%/sett).
 * - Ricomposizione: −10% (leggero deficit, compensato da proteine alte).
 * - Massa: +250 kcal/die assolute (banda lean bulk +200…+300, NON percentuale).
 * - Mantenimento / salute intestinale: 0.
 */
function deltaObiettivo(obiettivo: Obiettivo, tdee: number): number {
  switch (obiettivo) {
    case "dimagrimento":
      return Math.round(tdee * -0.2);
    case "ricomposizione":
      return Math.round(tdee * -0.1);
    case "massa":
      return 250;
    case "mantenimento":
    case "salute_intestinale":
      return 0;
  }
}

/**
 * §4 — Proteine: MINIMO g/kg per preservare la massa magra secondo obiettivo +
 * attività + condizioni. È un floor, non un target: la forma della dieta
 * (archetipo) resta primaria, ma le proteine non scendono sotto questo minimo.
 * Riferimento: in deficit 1.6–2.2 g/kg peso (1.6 base, 1.8 se ci si allena);
 * ipertrofia/ricomp 1.6–1.8; sedentari 0.8–0.9; anziani/menopausa 1.2;
 * gravidanza 1.1–1.5.
 */
function proteineMinGkg(p: ProfiloNutrizionale): number {
  const forza = p.allenamento === "forza" || p.allenamento === "misto";
  const cond = new Set(p.condizioni ?? []);
  let g: number;

  if (cond.has("gravidanza")) g = 1.1;
  else if (p.obiettivo === "dimagrimento") g = forza ? 1.8 : 1.6;
  else if (p.obiettivo === "ricomposizione") g = 1.8;
  else if (p.obiettivo === "massa") g = 1.6;
  else if (forza) g = 1.5;
  else if (p.attivita === "sedentario") g = 0.9;
  else if (p.attivita === "leggero") g = 1.1;
  else g = 1.2;

  // Floor clinici (sarcopenia / menopausa).
  if (p.eta >= 65 && g < 1.2) g = 1.2;
  if (cond.has("menopausa") && g < 1.2) g = 1.2;
  if (p.sesso === "donna" && p.eta >= 50 && g < 1.2) g = 1.2;

  return g;
}

/**
 * §4/§5/§6 — Distribuzione dei macro data una kcal target.
 * Proteine = % dell'archetipo con un MINIMO g/kg (preserva la massa magra);
 * grassi 20–35%E secondo la forma dell'archetipo; carbo a residuo.
 * Riusabile per ricalcolare i macro al cambio dieta senza rifare il BMR.
 */
export function distribuisciMacro(
  kcal: number,
  p: ProfiloNutrizionale,
  archetipoMacroPct?: { proteine: number; carboidrati: number; grassi: number },
): { macro: Macro; percentuali: { proteine: number; carboidrati: number; grassi: number }; proteineGkg: number } {
  const arch = archetipoMacroPct;
  const minGkg = proteineMinGkg(p);
  const protArchKcal = kcal * ((arch?.proteine ?? 18) / 100);
  let kcalProteine = Math.max(protArchKcal, minGkg * p.pesoKg * KCAL_PER_G.proteine);
  if (kcalProteine > kcal * 0.35) kcalProteine = kcal * 0.35;
  const proteine = Math.round(kcalProteine / KCAL_PER_G.proteine);

  const remaining = Math.max(0, kcal - kcalProteine);
  const carbShare = arch
    ? arch.carboidrati / (arch.carboidrati + arch.grassi)
    : 50 / (50 + 32); // ~0.61 (mediterranea)

  let kcalGrassi = remaining * (1 - carbShare);
  // Grassi entro 20–35%E; minimo assoluto 0.5 g/kg per la salute ormonale.
  const grassiFloorKcal = Math.max(0.5 * p.pesoKg * KCAL_PER_G.grassi, kcal * 0.2);
  const grassiCapKcal = kcal * 0.35;
  if (kcalGrassi < grassiFloorKcal) kcalGrassi = grassiFloorKcal;
  if (kcalGrassi > grassiCapKcal) kcalGrassi = grassiCapKcal;

  const grassi = Math.round(kcalGrassi / KCAL_PER_G.grassi);
  let carboidrati = Math.round((kcal - kcalProteine - grassi * KCAL_PER_G.grassi) / KCAL_PER_G.carboidrati);
  if (carboidrati < 0) carboidrati = 0;

  const macro: Macro = { proteine, carboidrati, grassi };
  const kcalTot = proteine * 4 + carboidrati * 4 + grassi * 9 || 1;
  const percentuali = {
    proteine: Math.round(((proteine * 4) / kcalTot) * 100),
    carboidrati: Math.round(((carboidrati * 4) / kcalTot) * 100),
    grassi: Math.round(((grassi * 9) / kcalTot) * 100),
  };
  const proteineGkg = p.pesoKg ? Math.round((proteine / p.pesoKg) * 10) / 10 : 0;
  return { macro, percentuali, proteineGkg };
}

/**
 * §2–§6 — Schema energetico + macros dal profilo.
 * Ordine: BMR → TDEE (attività corretta) → kcal obiettivo (floor sicurezza) →
 * proteine (g/kg, cap AMDR 35%E) → carbo/grassi divisi secondo l'archetipo
 * (floor grassi 0.8 g/kg + 20%E, cap 35%E) → carbo residuo.
 */
export function calcolaSchema(
  p: ProfiloNutrizionale,
  opzioni: OpzioniSchema = {},
): RisultatoNutrizionale {
  const note: string[] = [];
  const cond = new Set(p.condizioni ?? []);

  const { bmr, metodo } = calcolaBMR(p);

  const correzione = opzioni.correzioneAttivita ?? true;
  const attivitaUsata = correzione ? correggiAttivita(p.attivita) : p.attivita;
  if (correzione && attivitaUsata !== p.attivita) {
    note.push(
      "Abbiamo prudenzialmente considerato un livello di attività leggermente più basso di quello dichiarato: le persone tendono a sovrastimare il movimento. Se registri i passi possiamo affinarlo.",
    );
  }
  const tdee = calcolaTDEE(bmr, attivitaUsata);

  let delta = deltaObiettivo(p.obiettivo, tdee);
  // Gravidanza: mai in deficit.
  if (cond.has("gravidanza") && delta < 0) {
    delta = 0;
    note.push(
      "In gravidanza non impostiamo deficit calorici. Questo schema va sempre validato con il tuo medico o dietista.",
    );
  }

  let kcal = tdee + delta;

  // §3 — floor di sicurezza (donne 1200, uomini 1500).
  const minKcal = p.sesso === "donna" ? 1200 : 1500;
  if (kcal < minKcal) {
    kcal = minKcal;
    note.push(
      `Il tuo obiettivo richiederebbe un apporto molto basso: l'abbiamo fissato al minimo di sicurezza (${minKcal} kcal). Per un deficit più marcato serve il supporto di un professionista.`,
    );
  }

  // §4/§5/§6 — Distribuzione macro (proteine con floor g/kg, carbo/grassi
  // secondo la forma dell'archetipo). Estratta per poterla ricalcolare da una
  // kcal già nota (es. cambio dieta) senza rifare il BMR.
  const { macro, percentuali, proteineGkg: gkg } = distribuisciMacro(kcal, p, opzioni.archetipoMacroPct);

  // §3 — stima ritmo variazione peso (7700 kcal ≈ 1 kg grasso).
  const ritmoStimatoKgSettimana = Math.round(((delta * 7) / 7700) * 100) / 100;

  if (p.obiettivo === "dimagrimento") {
    note.push(
      "Ritmo salutare di dimagrimento: 0,5–1 kg a settimana. Un calo più rapido di solito significa perdere muscolo e acqua, non grasso.",
    );
  }
  if (forzaOMisto(p)) {
    note.push(
      "Nei giorni di allenamento aumenta i carboidrati (soprattutto pre/post workout) e punta a 20–40 g di proteine per pasto.",
    );
  }

  return {
    bmr,
    metodoBmr: metodo,
    tdee,
    attivitaUsata,
    kcalObiettivo: kcal,
    deltaKcal: delta,
    macro,
    percentuali,
    proteineGkg: gkg,
    ritmoStimatoKgSettimana,
    note,
  };
}

function forzaOMisto(p: ProfiloNutrizionale): boolean {
  return p.allenamento === "forza" || p.allenamento === "misto";
}

// ============================================================================
// §7 — Ripartizione dei pasti nella giornata (CREA + distribuzione anticipata).
// Colazione ~20%, spuntino ~5%, pranzo ~40%, merenda ~5%, cena ~30%.
// ============================================================================

export type Pasto = "colazione" | "spuntino" | "pranzo" | "merenda" | "cena";

export const RIPARTIZIONE_PASTI: Record<Pasto, number> = {
  colazione: 0.2,
  spuntino: 0.05,
  pranzo: 0.4,
  merenda: 0.05,
  cena: 0.3,
};

export type MacroPasto = { pasto: Pasto; kcal: number; macro: Macro };

/** Distribuisce kcal e macros giornalieri sui 5 pasti. */
export function ripartisciPasti(kcalGiorno: number, macro: Macro): MacroPasto[] {
  return (Object.keys(RIPARTIZIONE_PASTI) as Pasto[]).map((pasto) => {
    const q = RIPARTIZIONE_PASTI[pasto];
    return {
      pasto,
      kcal: Math.round(kcalGiorno * q),
      macro: {
        proteine: Math.round(macro.proteine * q),
        carboidrati: Math.round(macro.carboidrati * q),
        grassi: Math.round(macro.grassi * q),
      },
    };
  });
}
