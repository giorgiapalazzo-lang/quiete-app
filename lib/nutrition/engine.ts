// ============================================================================
// Motore nutrizionale di Quiete — calcolo di fabbisogno energetico e macros.
//
// IMPORTANTE (legale + prodotto): questo motore genera uno *schema alimentare
// orientativo* basato su linee guida pubbliche (Mifflin-St Jeor, EFSA/IOM AMDR,
// ISSN, LARN/SINU, CREA). NON è una prescrizione dietetica: quella in Italia è
// atto riservato a medico, biologo nutrizionista o dietista. La UI deve sempre
// mostrare il disclaimer e la CTA verso i nutrizionisti del team.
//
// Fonti principali:
// - BMR: Mifflin MD, St Jeor ST (1990) — equazione validata su 498 soggetti.
// - Moltiplicatori TDEE: standard 1.2–1.9 (AND/DC/ACSM).
// - Ripartizione macro: EFSA AMDR (carbo 45–60%, grassi 20–35%) + IOM.
// - Proteine g/kg: ISSN Position Stand (Jäger et al. 2017).
// - Deficit/surplus e ritmo sicuro: WHO/NHS/CDC (0.5–1 kg/sett; ~1%/sett).
// - Ripartizione pasti: CREA "Linee guida per una sana alimentazione" 2018.
// ============================================================================

export type Sesso = "uomo" | "donna";

// 5 livelli standard di attività (moltiplicatori TDEE).
export type LivelloAttivita =
  | "sedentario" // lavoro da scrivania, nessun esercizio
  | "leggero" // esercizio leggero 1–3 gg/sett
  | "moderato" // esercizio moderato 3–5 gg/sett
  | "attivo" // esercizio intenso 6–7 gg/sett
  | "molto_attivo"; // atleta / doppio allenamento / lavoro fisico

export const MOLTIPLICATORI_ATTIVITA: Record<LivelloAttivita, number> = {
  sedentario: 1.2,
  leggero: 1.375,
  moderato: 1.55,
  attivo: 1.725,
  molto_attivo: 1.9,
};

export type Obiettivo =
  | "dimagrimento"
  | "mantenimento"
  | "massa" // ipertrofia / aumento massa muscolare
  | "ricomposizione" // perdere grasso + preservare/costruire muscolo
  | "salute_intestinale"; // focus benessere gut, kcal ~ mantenimento

// Tipo di allenamento prevalente: influenza le proteine e i carbo.
export type TipoAllenamento = "nessuno" | "forza" | "cardio" | "misto";

export type ProfiloNutrizionale = {
  sesso: Sesso;
  eta: number; // anni
  altezzaCm: number;
  pesoKg: number;
  attivita: LivelloAttivita;
  obiettivo: Obiettivo;
  allenamento?: TipoAllenamento; // default "nessuno"
};

export type Macro = { proteine: number; carboidrati: number; grassi: number }; // grammi/giorno

export type RisultatoNutrizionale = {
  bmr: number; // metabolismo basale (kcal)
  tdee: number; // dispendio energetico totale (kcal)
  kcalObiettivo: number; // kcal giornaliere consigliate per l'obiettivo
  deltaKcal: number; // scarto rispetto al TDEE (negativo = deficit)
  macro: Macro;
  percentuali: { proteine: number; carboidrati: number; grassi: number }; // % kcal
  proteineGkg: number; // g proteine per kg usato nel calcolo
  ritmoStimatoKgSettimana: number; // stima variazione peso (negativa = calo)
  note: string[]; // avvisi/spiegazioni per l'utente (divulgazione)
};

// Kcal per grammo di macronutriente (fattori di Atwater).
const KCAL_PER_G = { proteine: 4, carboidrati: 4, grassi: 9 } as const;

/**
 * Metabolismo basale — equazione di Mifflin-St Jeor.
 * Uomo:  BMR = 10·peso + 6.25·altezza − 5·età + 5
 * Donna: BMR = 10·peso + 6.25·altezza − 5·età − 161
 */
export function calcolaBMR(p: Pick<ProfiloNutrizionale, "sesso" | "eta" | "altezzaCm" | "pesoKg">): number {
  const base = 10 * p.pesoKg + 6.25 * p.altezzaCm - 5 * p.eta;
  return Math.round(base + (p.sesso === "uomo" ? 5 : -161));
}

/** Dispendio energetico totale = BMR × moltiplicatore attività. */
export function calcolaTDEE(bmr: number, attivita: LivelloAttivita): number {
  return Math.round(bmr * MOLTIPLICATORI_ATTIVITA[attivita]);
}

/**
 * Scarto calorico per obiettivo (in frazione del TDEE).
 * - Dimagrimento: −20% (deficit moderato, preserva massa magra; ~0.5–1 kg/sett).
 * - Massa: +12% surplus contenuto (limita l'accumulo di grasso).
 * - Ricomposizione: −10% leggero deficit, compensato da proteine alte.
 * - Mantenimento / salute intestinale: 0.
 */
function fattoreObiettivo(obiettivo: Obiettivo): number {
  switch (obiettivo) {
    case "dimagrimento":
      return -0.2;
    case "massa":
      return 0.12;
    case "ricomposizione":
      return -0.1;
    case "mantenimento":
    case "salute_intestinale":
      return 0;
  }
}

/**
 * Proteine in g/kg di peso corporeo, secondo obiettivo + attività + sesso.
 * Base ISSN: sedentari 0.8–1.0; attivi 1.2–1.6; forza 1.6–2.0; in deficit 2.0–2.4.
 * Donna in menopausa (età ≥ 50): minimo 1.2 per la salute muscolo-scheletrica.
 */
function proteineGkg(p: ProfiloNutrizionale): number {
  const forza = p.allenamento === "forza" || p.allenamento === "misto";
  let g: number;

  if (p.obiettivo === "dimagrimento") g = 2.0; // preserva massa magra in deficit
  else if (p.obiettivo === "ricomposizione") g = 2.2;
  else if (p.obiettivo === "massa") g = forza ? 1.9 : 1.6;
  else if (forza) g = 1.7;
  else if (p.attivita === "sedentario") g = 1.0;
  else g = 1.4;

  // Salvaguardia menopausa/anziani.
  if (p.sesso === "donna" && p.eta >= 50 && g < 1.2) g = 1.2;

  return g;
}

/**
 * Calcolo completo dello schema energetico + macros a partire dal profilo.
 * Ordine: proteine (per kg) → grassi (%kcal minimo salutare) → carbo (resto).
 */
export function calcolaSchema(p: ProfiloNutrizionale): RisultatoNutrizionale {
  const note: string[] = [];
  const bmr = calcolaBMR(p);
  const tdee = calcolaTDEE(bmr, p.attivita);

  const delta = Math.round(tdee * fattoreObiettivo(p.obiettivo));
  let kcal = tdee + delta;

  // Floor di sicurezza: mai sotto il BMR e mai sotto soglie minime salutari
  // (1200 kcal donne, 1500 kcal uomini) — sotto queste serve un professionista.
  const minKcal = p.sesso === "donna" ? 1200 : 1500;
  if (kcal < minKcal) {
    kcal = minKcal;
    note.push(
      `Il tuo obiettivo richiederebbe un apporto molto basso: l'abbiamo fissato al minimo di sicurezza (${minKcal} kcal). Per un deficit più marcato serve il supporto di un professionista.`
    );
  }

  // Proteine (g/kg → grammi → kcal).
  const gkg = proteineGkg(p);
  const proteine = Math.round(gkg * p.pesoKg);
  const kcalProteine = proteine * KCAL_PER_G.proteine;

  // Grassi: 27% delle kcal (dentro EFSA 20–35%), floor 0.8 g/kg per gli ormoni.
  let grassi = Math.round((kcal * 0.27) / KCAL_PER_G.grassi);
  const grassiMin = Math.round(0.8 * p.pesoKg);
  if (grassi < grassiMin) grassi = grassiMin;
  const kcalGrassi = grassi * KCAL_PER_G.grassi;

  // Carboidrati: kcal residue.
  let carboidrati = Math.round((kcal - kcalProteine - kcalGrassi) / KCAL_PER_G.carboidrati);
  if (carboidrati < 0) carboidrati = 0;

  const macro: Macro = { proteine, carboidrati, grassi };

  const kcalTot = proteine * 4 + carboidrati * 4 + grassi * 9;
  const percentuali = {
    proteine: Math.round(((proteine * 4) / kcalTot) * 100),
    carboidrati: Math.round(((carboidrati * 4) / kcalTot) * 100),
    grassi: Math.round(((grassi * 9) / kcalTot) * 100),
  };

  // Stima ritmo di variazione peso: 7700 kcal ≈ 1 kg di grasso.
  const ritmoStimatoKgSettimana = Math.round(((delta * 7) / 7700) * 100) / 100;

  if (p.obiettivo === "dimagrimento") {
    note.push(
      "Ritmo salutare di dimagrimento: 0,5–1 kg a settimana. Un calo più rapido di solito significa perdere muscolo e acqua, non grasso."
    );
  }
  if (p.allenamento === "forza" || p.allenamento === "misto") {
    note.push(
      "Nei giorni di allenamento aumenta i carboidrati (soprattutto pre/post workout) e punta a 20–40 g di proteine per pasto."
    );
  }

  return {
    bmr,
    tdee,
    kcalObiettivo: kcal,
    deltaKcal: delta,
    macro,
    percentuali,
    proteineGkg: gkg,
    ritmoStimatoKgSettimana,
    note,
  };
}

// ============================================================================
// Ripartizione dei pasti nella giornata (CREA — sana alimentazione).
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

/** Distribuisce kcal e macros giornalieri sui 5 pasti secondo la ripartizione CREA. */
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
