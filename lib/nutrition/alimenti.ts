// ============================================================================
// Database alimenti di Quiete — valori nutrizionali per 100 g di parte edibile.
//
// Fonte dei valori: tabelle di composizione degli alimenti CREA (Centro di
// Ricerca Alimenti e Nutrizione) — riferimento ufficiale italiano. I flag per
// condizione (glutine, lattosio, FODMAP, indice glicemico) servono sia alla
// divulgazione ("perché questo cibo") sia ai filtri per patologia.
//
// Questo è un set di partenza esteso ai cibi italiani più comuni: è pensato per
// crescere (import completo CREA/BDA) e per essere migrato nella tabella `foods`
// di Supabase con lo stesso schema.
// ============================================================================

export type CategoriaAlimento =
  | "cereali"
  | "legumi"
  | "verdura"
  | "frutta"
  | "carne"
  | "pesce"
  | "uova"
  | "latticini"
  | "frutta_secca"
  | "grassi"
  | "dolci"
  | "bevande";

// Livello FODMAP: "basso" è sicuro in fase di eliminazione IBS.
export type LivelloFodmap = "basso" | "medio" | "alto";
// Indice glicemico: rilevante per diabete e gestione della glicemia.
export type IndiceGlicemico = "basso" | "medio" | "alto" | "na"; // na = non applicabile (proteine/grassi puri)

export type Alimento = {
  id: string;
  nome: string;
  categoria: CategoriaAlimento;
  // Valori per 100 g di parte edibile.
  kcal: number;
  proteine: number; // g
  carboidrati: number; // g
  grassi: number; // g
  fibra: number; // g
  // Flag per condizione.
  glutine: boolean; // true = contiene glutine
  lattosio: boolean; // true = contiene lattosio
  fodmap: LivelloFodmap;
  ig: IndiceGlicemico;
  // Porzione standard di riferimento (LARN/CREA), in grammi.
  porzioneG: number;
};

export const ALIMENTI: Alimento[] = [
  // ---- Cereali ----
  { id: "pasta_semola", nome: "Pasta di semola", categoria: "cereali", kcal: 353, proteine: 11, carboidrati: 71, grassi: 1.5, fibra: 2.7, glutine: true, lattosio: false, fodmap: "alto", ig: "medio", porzioneG: 80 },
  { id: "pasta_integrale", nome: "Pasta integrale", categoria: "cereali", kcal: 348, proteine: 13, carboidrati: 66, grassi: 2.5, fibra: 7, glutine: true, lattosio: false, fodmap: "alto", ig: "basso", porzioneG: 80 },
  { id: "riso_bianco", nome: "Riso bianco", categoria: "cereali", kcal: 332, proteine: 6.7, carboidrati: 80, grassi: 0.4, fibra: 1, glutine: false, lattosio: false, fodmap: "basso", ig: "alto", porzioneG: 80 },
  { id: "riso_basmati", nome: "Riso basmati", categoria: "cereali", kcal: 349, proteine: 7.5, carboidrati: 78, grassi: 0.6, fibra: 1.3, glutine: false, lattosio: false, fodmap: "basso", ig: "medio", porzioneG: 80 },
  { id: "pane_bianco", nome: "Pane bianco", categoria: "cereali", kcal: 265, proteine: 8.6, carboidrati: 51, grassi: 3.5, fibra: 2.7, glutine: true, lattosio: false, fodmap: "alto", ig: "alto", porzioneG: 50 },
  { id: "pane_integrale", nome: "Pane integrale", categoria: "cereali", kcal: 224, proteine: 8, carboidrati: 40, grassi: 2.9, fibra: 6.5, glutine: true, lattosio: false, fodmap: "medio", ig: "medio", porzioneG: 50 },
  { id: "avena", nome: "Fiocchi d'avena", categoria: "cereali", kcal: 389, proteine: 16.9, carboidrati: 66, grassi: 6.9, fibra: 10.6, glutine: false, lattosio: false, fodmap: "medio", ig: "basso", porzioneG: 40 },
  { id: "quinoa", nome: "Quinoa", categoria: "cereali", kcal: 368, proteine: 14, carboidrati: 64, grassi: 6, fibra: 7, glutine: false, lattosio: false, fodmap: "basso", ig: "basso", porzioneG: 80 },
  { id: "orzo", nome: "Orzo perlato", categoria: "cereali", kcal: 319, proteine: 10.4, carboidrati: 71, grassi: 1.4, fibra: 9.2, glutine: true, lattosio: false, fodmap: "alto", ig: "basso", porzioneG: 80 },
  { id: "patate", nome: "Patate", categoria: "verdura", kcal: 77, proteine: 2, carboidrati: 17, grassi: 0.1, fibra: 1.6, glutine: false, lattosio: false, fodmap: "basso", ig: "alto", porzioneG: 200 },

  // ---- Legumi ----
  { id: "lenticchie", nome: "Lenticchie (cotte)", categoria: "legumi", kcal: 116, proteine: 9, carboidrati: 20, grassi: 0.4, fibra: 7.9, glutine: false, lattosio: false, fodmap: "medio", ig: "basso", porzioneG: 150 },
  { id: "ceci", nome: "Ceci (cotti)", categoria: "legumi", kcal: 164, proteine: 8.9, carboidrati: 27, grassi: 2.6, fibra: 7.6, glutine: false, lattosio: false, fodmap: "medio", ig: "basso", porzioneG: 150 },
  { id: "fagioli", nome: "Fagioli borlotti (cotti)", categoria: "legumi", kcal: 133, proteine: 9.1, carboidrati: 23, grassi: 0.5, fibra: 8.3, glutine: false, lattosio: false, fodmap: "alto", ig: "basso", porzioneG: 150 },
  { id: "piselli", nome: "Piselli", categoria: "legumi", kcal: 81, proteine: 5.4, carboidrati: 14, grassi: 0.4, fibra: 5.1, glutine: false, lattosio: false, fodmap: "medio", ig: "basso", porzioneG: 150 },
  { id: "edamame", nome: "Edamame (soia)", categoria: "legumi", kcal: 122, proteine: 11, carboidrati: 9, grassi: 5, fibra: 5.2, glutine: false, lattosio: false, fodmap: "basso", ig: "basso", porzioneG: 150 },

  // ---- Verdura ----
  { id: "zucchine", nome: "Zucchine", categoria: "verdura", kcal: 17, proteine: 1.3, carboidrati: 3.1, grassi: 0.1, fibra: 1.1, glutine: false, lattosio: false, fodmap: "basso", ig: "basso", porzioneG: 200 },
  { id: "spinaci", nome: "Spinaci", categoria: "verdura", kcal: 23, proteine: 2.9, carboidrati: 3.6, grassi: 0.4, fibra: 2.2, glutine: false, lattosio: false, fodmap: "basso", ig: "basso", porzioneG: 200 },
  { id: "pomodori", nome: "Pomodori", categoria: "verdura", kcal: 18, proteine: 0.9, carboidrati: 3.9, grassi: 0.2, fibra: 1.2, glutine: false, lattosio: false, fodmap: "basso", ig: "basso", porzioneG: 200 },
  { id: "broccoli", nome: "Broccoli", categoria: "verdura", kcal: 34, proteine: 2.8, carboidrati: 7, grassi: 0.4, fibra: 2.6, glutine: false, lattosio: false, fodmap: "medio", ig: "basso", porzioneG: 200 },
  { id: "carote", nome: "Carote", categoria: "verdura", kcal: 41, proteine: 0.9, carboidrati: 10, grassi: 0.2, fibra: 2.8, glutine: false, lattosio: false, fodmap: "basso", ig: "basso", porzioneG: 200 },
  { id: "insalata", nome: "Lattuga", categoria: "verdura", kcal: 15, proteine: 1.4, carboidrati: 2.9, grassi: 0.2, fibra: 1.3, glutine: false, lattosio: false, fodmap: "basso", ig: "basso", porzioneG: 80 },
  { id: "melanzane", nome: "Melanzane", categoria: "verdura", kcal: 25, proteine: 1, carboidrati: 6, grassi: 0.2, fibra: 3, glutine: false, lattosio: false, fodmap: "basso", ig: "basso", porzioneG: 200 },
  { id: "cavolfiore", nome: "Cavolfiore", categoria: "verdura", kcal: 25, proteine: 1.9, carboidrati: 5, grassi: 0.3, fibra: 2, glutine: false, lattosio: false, fodmap: "alto", ig: "basso", porzioneG: 200 },

  // ---- Frutta ----
  { id: "mela", nome: "Mela", categoria: "frutta", kcal: 52, proteine: 0.3, carboidrati: 14, grassi: 0.2, fibra: 2.4, glutine: false, lattosio: false, fodmap: "alto", ig: "basso", porzioneG: 150 },
  { id: "banana", nome: "Banana", categoria: "frutta", kcal: 89, proteine: 1.1, carboidrati: 23, grassi: 0.3, fibra: 2.6, glutine: false, lattosio: false, fodmap: "basso", ig: "medio", porzioneG: 150 },
  { id: "fragole", nome: "Fragole", categoria: "frutta", kcal: 32, proteine: 0.7, carboidrati: 7.7, grassi: 0.3, fibra: 2, glutine: false, lattosio: false, fodmap: "basso", ig: "basso", porzioneG: 150 },
  { id: "arancia", nome: "Arancia", categoria: "frutta", kcal: 47, proteine: 0.9, carboidrati: 12, grassi: 0.1, fibra: 2.4, glutine: false, lattosio: false, fodmap: "basso", ig: "basso", porzioneG: 150 },
  { id: "kiwi", nome: "Kiwi", categoria: "frutta", kcal: 61, proteine: 1.1, carboidrati: 15, grassi: 0.5, fibra: 3, glutine: false, lattosio: false, fodmap: "basso", ig: "basso", porzioneG: 150 },
  { id: "mirtilli", nome: "Mirtilli", categoria: "frutta", kcal: 57, proteine: 0.7, carboidrati: 14, grassi: 0.3, fibra: 2.4, glutine: false, lattosio: false, fodmap: "basso", ig: "basso", porzioneG: 150 },

  // ---- Carne ----
  { id: "pollo_petto", nome: "Petto di pollo", categoria: "carne", kcal: 165, proteine: 31, carboidrati: 0, grassi: 3.6, fibra: 0, glutine: false, lattosio: false, fodmap: "basso", ig: "na", porzioneG: 150 },
  { id: "tacchino", nome: "Fesa di tacchino", categoria: "carne", kcal: 135, proteine: 30, carboidrati: 0, grassi: 1, fibra: 0, glutine: false, lattosio: false, fodmap: "basso", ig: "na", porzioneG: 150 },
  { id: "manzo_magro", nome: "Manzo magro", categoria: "carne", kcal: 158, proteine: 22, carboidrati: 0, grassi: 7.5, fibra: 0, glutine: false, lattosio: false, fodmap: "basso", ig: "na", porzioneG: 100 },
  { id: "bresaola", nome: "Bresaola", categoria: "carne", kcal: 151, proteine: 32, carboidrati: 0.4, grassi: 2, fibra: 0, glutine: false, lattosio: false, fodmap: "basso", ig: "na", porzioneG: 50 },
  { id: "prosciutto_crudo", nome: "Prosciutto crudo (sgrassato)", categoria: "carne", kcal: 224, proteine: 26, carboidrati: 0, grassi: 13, fibra: 0, glutine: false, lattosio: false, fodmap: "basso", ig: "na", porzioneG: 50 },

  // ---- Pesce ----
  { id: "salmone", nome: "Salmone", categoria: "pesce", kcal: 208, proteine: 20, carboidrati: 0, grassi: 13, fibra: 0, glutine: false, lattosio: false, fodmap: "basso", ig: "na", porzioneG: 150 },
  { id: "merluzzo", nome: "Merluzzo", categoria: "pesce", kcal: 82, proteine: 18, carboidrati: 0, grassi: 0.7, fibra: 0, glutine: false, lattosio: false, fodmap: "basso", ig: "na", porzioneG: 150 },
  { id: "tonno_naturale", nome: "Tonno al naturale", categoria: "pesce", kcal: 116, proteine: 26, carboidrati: 0, grassi: 1, fibra: 0, glutine: false, lattosio: false, fodmap: "basso", ig: "na", porzioneG: 100 },
  { id: "orata", nome: "Orata", categoria: "pesce", kcal: 121, proteine: 20, carboidrati: 0, grassi: 4.5, fibra: 0, glutine: false, lattosio: false, fodmap: "basso", ig: "na", porzioneG: 150 },
  { id: "gamberi", nome: "Gamberi", categoria: "pesce", kcal: 85, proteine: 20, carboidrati: 0, grassi: 0.5, fibra: 0, glutine: false, lattosio: false, fodmap: "basso", ig: "na", porzioneG: 150 },

  // ---- Uova ----
  { id: "uovo", nome: "Uovo intero", categoria: "uova", kcal: 143, proteine: 12.6, carboidrati: 0.7, grassi: 9.5, fibra: 0, glutine: false, lattosio: false, fodmap: "basso", ig: "na", porzioneG: 60 },
  { id: "albume", nome: "Albume", categoria: "uova", kcal: 52, proteine: 11, carboidrati: 0.7, grassi: 0.2, fibra: 0, glutine: false, lattosio: false, fodmap: "basso", ig: "na", porzioneG: 100 },

  // ---- Latticini ----
  { id: "yogurt_greco", nome: "Yogurt greco 0%", categoria: "latticini", kcal: 59, proteine: 10, carboidrati: 3.6, grassi: 0.4, fibra: 0, glutine: false, lattosio: true, fodmap: "medio", ig: "basso", porzioneG: 150 },
  { id: "latte_scremato", nome: "Latte scremato", categoria: "latticini", kcal: 36, proteine: 3.4, carboidrati: 5, grassi: 0.2, fibra: 0, glutine: false, lattosio: true, fodmap: "alto", ig: "basso", porzioneG: 200 },
  { id: "parmigiano", nome: "Parmigiano Reggiano", categoria: "latticini", kcal: 392, proteine: 33, carboidrati: 0, grassi: 29, fibra: 0, glutine: false, lattosio: false, fodmap: "basso", ig: "na", porzioneG: 30 },
  { id: "mozzarella", nome: "Mozzarella", categoria: "latticini", kcal: 253, proteine: 18, carboidrati: 0.7, grassi: 20, fibra: 0, glutine: false, lattosio: true, fodmap: "basso", ig: "na", porzioneG: 100 },
  { id: "ricotta", nome: "Ricotta", categoria: "latticini", kcal: 146, proteine: 8.8, carboidrati: 3, grassi: 11, fibra: 0, glutine: false, lattosio: true, fodmap: "medio", ig: "basso", porzioneG: 100 },

  // ---- Frutta secca e grassi ----
  { id: "mandorle", nome: "Mandorle", categoria: "frutta_secca", kcal: 579, proteine: 21, carboidrati: 22, grassi: 49, fibra: 12.5, glutine: false, lattosio: false, fodmap: "medio", ig: "basso", porzioneG: 30 },
  { id: "noci", nome: "Noci", categoria: "frutta_secca", kcal: 654, proteine: 15, carboidrati: 14, grassi: 65, fibra: 6.7, glutine: false, lattosio: false, fodmap: "basso", ig: "basso", porzioneG: 30 },
  { id: "olio_evo", nome: "Olio extravergine d'oliva", categoria: "grassi", kcal: 899, proteine: 0, carboidrati: 0, grassi: 100, fibra: 0, glutine: false, lattosio: false, fodmap: "basso", ig: "na", porzioneG: 10 },
  { id: "avocado", nome: "Avocado", categoria: "frutta", kcal: 160, proteine: 2, carboidrati: 9, grassi: 15, fibra: 6.7, glutine: false, lattosio: false, fodmap: "medio", ig: "basso", porzioneG: 100 },
];

// Indice per accesso O(1) via id.
export const ALIMENTI_BY_ID: Record<string, Alimento> = Object.fromEntries(
  ALIMENTI.map((a) => [a.id, a])
);

/** Valori nutrizionali per una quantità arbitraria (g) di un alimento. */
export function nutriPerGrammi(id: string, grammi: number): { kcal: number; proteine: number; carboidrati: number; grassi: number; fibra: number } | null {
  const a = ALIMENTI_BY_ID[id];
  if (!a) return null;
  const k = grammi / 100;
  return {
    kcal: Math.round(a.kcal * k),
    proteine: Math.round(a.proteine * k * 10) / 10,
    carboidrati: Math.round(a.carboidrati * k * 10) / 10,
    grassi: Math.round(a.grassi * k * 10) / 10,
    fibra: Math.round(a.fibra * k * 10) / 10,
  };
}

/** Filtra gli alimenti compatibili con le restrizioni dichiarate. */
export function filtraAlimenti(opts: {
  senzaGlutine?: boolean;
  senzaLattosio?: boolean;
  soloFodmapBasso?: boolean;
  vegetariano?: boolean;
  vegano?: boolean;
}): Alimento[] {
  const CARNE_PESCE: CategoriaAlimento[] = ["carne", "pesce"];
  const ANIMALI: CategoriaAlimento[] = ["carne", "pesce", "uova", "latticini"];
  return ALIMENTI.filter((a) => {
    if (opts.senzaGlutine && a.glutine) return false;
    if (opts.senzaLattosio && a.lattosio) return false;
    if (opts.soloFodmapBasso && a.fodmap !== "basso") return false;
    if (opts.vegetariano && CARNE_PESCE.includes(a.categoria)) return false;
    if (opts.vegano && ANIMALI.includes(a.categoria)) return false;
    return true;
  });
}
