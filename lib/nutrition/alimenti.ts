// ============================================================================
// Database alimenti di Quiete — valori nutrizionali per 100 g di parte edibile.
//
// Fonte: tabelle di composizione CREA (riferimento ufficiale italiano). I flag
// per condizione (glutine, lattosio, FODMAP, indice glicemico) servono ai filtri
// e alla divulgazione. `stagione` = mesi di stagionalità italiana (1=gen…12=dic)
// per verdura e frutta. `ruolo` guida le SOSTITUZIONI (si sostituisce un cibo
// con un altro dello stesso ruolo, aggiustando la grammatura sul macro guida).
// ============================================================================

export type CategoriaAlimento =
  | "cereali" | "legumi" | "verdura" | "frutta" | "carne" | "pesce"
  | "uova" | "latticini" | "frutta_secca" | "grassi" | "dolci" | "bevande";

export type LivelloFodmap = "basso" | "medio" | "alto";
export type IndiceGlicemico = "basso" | "medio" | "alto" | "na";
export type RuoloAlimento = "carbo" | "proteine" | "grassi" | "verdura" | "frutta";

export type Alimento = {
  id: string;
  nome: string;
  categoria: CategoriaAlimento;
  kcal: number;
  proteine: number;
  carboidrati: number;
  grassi: number;
  fibra: number;
  glutine: boolean;
  lattosio: boolean;
  fodmap: LivelloFodmap;
  ig: IndiceGlicemico;
  porzioneG: number;
  stagione?: number[]; // mesi di stagionalità (verdura/frutta)
};

const A = (
  id: string, nome: string, categoria: CategoriaAlimento,
  kcal: number, proteine: number, carboidrati: number, grassi: number, fibra: number,
  glutine: boolean, lattosio: boolean, fodmap: LivelloFodmap, ig: IndiceGlicemico,
  porzioneG: number, stagione?: number[],
): Alimento => ({ id, nome, categoria, kcal, proteine, carboidrati, grassi, fibra, glutine, lattosio, fodmap, ig, porzioneG, stagione });

export const ALIMENTI: Alimento[] = [
  // ---- Cereali & fonti di carboidrati ----
  A("pasta_semola", "Pasta di semola", "cereali", 353, 11, 71, 1.5, 2.7, true, false, "alto", "medio", 80),
  A("pasta_integrale", "Pasta integrale", "cereali", 348, 13, 66, 2.5, 7, true, false, "alto", "basso", 80),
  A("riso_bianco", "Riso bianco", "cereali", 332, 6.7, 80, 0.4, 1, false, false, "basso", "alto", 80),
  A("riso_basmati", "Riso basmati", "cereali", 349, 7.5, 78, 0.6, 1.3, false, false, "basso", "medio", 80),
  A("riso_integrale", "Riso integrale", "cereali", 337, 7.5, 73, 2.2, 3.4, false, false, "basso", "medio", 80),
  A("pane_bianco", "Pane bianco", "cereali", 265, 8.6, 51, 3.5, 2.7, true, false, "alto", "alto", 50),
  A("pane_integrale", "Pane integrale", "cereali", 224, 8, 40, 2.9, 6.5, true, false, "medio", "medio", 50),
  A("pane_segale", "Pane di segale", "cereali", 259, 8.5, 48, 1.7, 5.8, true, false, "medio", "basso", 50),
  A("avena", "Fiocchi d'avena", "cereali", 389, 16.9, 66, 6.9, 10.6, false, false, "medio", "basso", 40),
  A("quinoa", "Quinoa", "cereali", 368, 14, 64, 6, 7, false, false, "basso", "basso", 80),
  A("orzo", "Orzo perlato", "cereali", 319, 10.4, 71, 1.4, 9.2, true, false, "alto", "basso", 80),
  A("farro", "Farro", "cereali", 335, 15, 67, 2.5, 6.8, true, false, "medio", "basso", 80),
  A("cous_cous", "Cous cous", "cereali", 376, 13, 77, 0.6, 5, true, false, "alto", "medio", 80),
  A("grano_saraceno", "Grano saraceno", "cereali", 343, 13, 72, 3.4, 10, false, false, "basso", "basso", 80),
  A("polenta", "Polenta (mais)", "cereali", 362, 8.7, 79, 2.7, 3.8, false, false, "basso", "alto", 80),
  A("gnocchi", "Gnocchi di patate", "cereali", 157, 3.6, 33, 0.6, 1.8, true, false, "alto", "alto", 150),
  A("fette_biscottate", "Fette biscottate", "cereali", 408, 11, 76, 6, 3.5, true, false, "alto", "alto", 30),
  A("patate", "Patate", "verdura", 77, 2, 17, 0.1, 1.6, false, false, "basso", "alto", 200),
  A("patate_dolci", "Patate dolci", "verdura", 86, 1.6, 20, 0.1, 3, false, false, "basso", "medio", 200),

  // ---- Legumi (proteine vegetali) ----
  A("lenticchie", "Lenticchie (cotte)", "legumi", 116, 9, 20, 0.4, 7.9, false, false, "medio", "basso", 150),
  A("ceci", "Ceci (cotti)", "legumi", 164, 8.9, 27, 2.6, 7.6, false, false, "medio", "basso", 150),
  A("fagioli", "Fagioli borlotti (cotti)", "legumi", 133, 9.1, 23, 0.5, 8.3, false, false, "alto", "basso", 150),
  A("cannellini", "Fagioli cannellini (cotti)", "legumi", 130, 9.5, 22, 0.6, 8, false, false, "alto", "basso", 150),
  A("piselli", "Piselli", "legumi", 81, 5.4, 14, 0.4, 5.1, false, false, "medio", "basso", 150),
  A("fave", "Fave (cotte)", "legumi", 110, 7.6, 18, 0.6, 5.4, false, false, "alto", "basso", 150, [3, 4, 5, 6]),
  A("edamame", "Edamame (soia)", "legumi", 122, 11, 9, 5, 5.2, false, false, "basso", "basso", 150),
  A("hummus", "Hummus", "legumi", 177, 8, 15, 9, 6, false, false, "medio", "basso", 60),

  // ---- Verdura (con stagionalità) ----
  A("zucchine", "Zucchine", "verdura", 17, 1.3, 3.1, 0.1, 1.1, false, false, "basso", "basso", 200, [5, 6, 7, 8, 9]),
  A("spinaci", "Spinaci", "verdura", 23, 2.9, 3.6, 0.4, 2.2, false, false, "basso", "basso", 200, [10, 11, 12, 1, 2, 3, 4]),
  A("pomodori", "Pomodori", "verdura", 18, 0.9, 3.9, 0.2, 1.2, false, false, "basso", "basso", 200, [6, 7, 8, 9]),
  A("broccoli", "Broccoli", "verdura", 34, 2.8, 7, 0.4, 2.6, false, false, "medio", "basso", 200, [10, 11, 12, 1, 2, 3]),
  A("carote", "Carote", "verdura", 41, 0.9, 10, 0.2, 2.8, false, false, "basso", "basso", 200, [1,2,3,4,5,6,7,8,9,10,11,12]),
  A("insalata", "Lattuga", "verdura", 15, 1.4, 2.9, 0.2, 1.3, false, false, "basso", "basso", 80, [4,5,6,7,8,9,10]),
  A("melanzane", "Melanzane", "verdura", 25, 1, 6, 0.2, 3, false, false, "basso", "basso", 200, [6, 7, 8, 9]),
  A("cavolfiore", "Cavolfiore", "verdura", 25, 1.9, 5, 0.3, 2, false, false, "alto", "basso", 200, [10, 11, 12, 1, 2, 3]),
  A("zucca", "Zucca", "verdura", 26, 1.1, 6.5, 0.1, 1.4, false, false, "basso", "medio", 200, [9, 10, 11, 12]),
  A("finocchi", "Finocchi", "verdura", 31, 1.2, 4, 0.2, 2.2, false, false, "basso", "basso", 200, [10, 11, 12, 1, 2, 3, 4]),
  A("peperoni", "Peperoni", "verdura", 26, 0.9, 6, 0.3, 1.9, false, false, "basso", "basso", 200, [6, 7, 8, 9]),
  A("fagiolini", "Fagiolini", "verdura", 31, 2.1, 7, 0.1, 2.9, false, false, "basso", "basso", 200, [6, 7, 8, 9]),
  A("cetrioli", "Cetrioli", "verdura", 16, 0.7, 3.6, 0.1, 0.8, false, false, "basso", "basso", 200, [5, 6, 7, 8, 9]),
  A("asparagi", "Asparagi", "verdura", 20, 2.2, 3.9, 0.1, 2.1, false, false, "alto", "basso", 200, [3, 4, 5]),
  A("carciofi", "Carciofi", "verdura", 47, 3.3, 11, 0.2, 5.4, false, false, "alto", "basso", 200, [11, 12, 1, 2, 3, 4]),
  A("radicchio", "Radicchio", "verdura", 23, 1.4, 4.5, 0.2, 3, false, false, "basso", "basso", 150, [9, 10, 11, 12, 1, 2]),
  A("cavolo_nero", "Cavolo nero", "verdura", 35, 3.3, 4.4, 0.7, 3.6, false, false, "medio", "basso", 200, [10, 11, 12, 1, 2]),
  A("verza", "Verza", "verdura", 25, 2, 4.8, 0.1, 2.9, false, false, "medio", "basso", 200, [10, 11, 12, 1, 2, 3]),
  A("bietole", "Bietole", "verdura", 19, 1.8, 2.8, 0.2, 2.1, false, false, "basso", "basso", 200, [1,2,3,4,5,6,7,8,9,10,11,12]),
  A("sedano", "Sedano", "verdura", 16, 0.7, 3, 0.2, 1.6, false, false, "basso", "basso", 100, [1,2,3,4,5,6,7,8,9,10,11,12]),
  A("funghi", "Funghi champignon", "verdura", 22, 3.1, 3.3, 0.3, 1, false, false, "alto", "basso", 150, [1,2,3,4,5,6,7,8,9,10,11,12]),

  // ---- Frutta (con stagionalità) ----
  A("mela", "Mela", "frutta", 52, 0.3, 14, 0.2, 2.4, false, false, "alto", "basso", 150, [8, 9, 10, 11, 12, 1]),
  A("pera", "Pera", "frutta", 57, 0.4, 15, 0.1, 3.1, false, false, "alto", "basso", 150, [8, 9, 10, 11]),
  A("banana", "Banana", "frutta", 89, 1.1, 23, 0.3, 2.6, false, false, "basso", "medio", 150, [1,2,3,4,5,6,7,8,9,10,11,12]),
  A("fragole", "Fragole", "frutta", 32, 0.7, 7.7, 0.3, 2, false, false, "basso", "basso", 150, [4, 5, 6]),
  A("arancia", "Arancia", "frutta", 47, 0.9, 12, 0.1, 2.4, false, false, "basso", "basso", 150, [11, 12, 1, 2, 3]),
  A("mandarino", "Mandarino", "frutta", 53, 0.8, 13, 0.3, 1.8, false, false, "basso", "basso", 150, [11, 12, 1, 2]),
  A("kiwi", "Kiwi", "frutta", 61, 1.1, 15, 0.5, 3, false, false, "basso", "basso", 150, [10, 11, 12, 1, 2, 3, 4]),
  A("mirtilli", "Mirtilli", "frutta", 57, 0.7, 14, 0.3, 2.4, false, false, "basso", "basso", 150, [6, 7, 8, 9]),
  A("lamponi", "Lamponi", "frutta", 52, 1.2, 12, 0.7, 6.5, false, false, "basso", "basso", 150, [6, 7, 8, 9]),
  A("pesca", "Pesca", "frutta", 39, 0.9, 9.5, 0.3, 1.5, false, false, "alto", "basso", 150, [6, 7, 8, 9]),
  A("albicocca", "Albicocca", "frutta", 48, 1.4, 11, 0.4, 2, false, false, "alto", "basso", 150, [6, 7, 8]),
  A("ciliegie", "Ciliegie", "frutta", 63, 1, 16, 0.2, 2.1, false, false, "alto", "basso", 150, [5, 6, 7]),
  A("uva", "Uva", "frutta", 69, 0.7, 18, 0.2, 0.9, false, false, "medio", "medio", 150, [8, 9, 10]),
  A("anguria", "Anguria", "frutta", 30, 0.6, 7.6, 0.2, 0.4, false, false, "alto", "alto", 250, [6, 7, 8, 9]),
  A("melone", "Melone", "frutta", 34, 0.8, 8, 0.2, 0.9, false, false, "medio", "medio", 250, [6, 7, 8, 9]),
  A("fichi", "Fichi", "frutta", 74, 0.8, 19, 0.3, 2.9, false, false, "alto", "medio", 100, [8, 9]),
  A("cachi", "Cachi", "frutta", 70, 0.6, 18, 0.2, 3.6, false, false, "alto", "medio", 100, [10, 11, 12]),
  A("prugna", "Prugna", "frutta", 46, 0.7, 11, 0.3, 1.4, false, false, "alto", "basso", 150, [7, 8, 9]),
  A("avocado", "Avocado", "frutta", 160, 2, 9, 15, 6.7, false, false, "medio", "basso", 100, [1,2,3,4,5,6,7,8,9,10,11,12]),

  // ---- Carne ----
  A("pollo_petto", "Petto di pollo", "carne", 165, 31, 0, 3.6, 0, false, false, "basso", "na", 150),
  A("tacchino", "Fesa di tacchino", "carne", 135, 30, 0, 1, 0, false, false, "basso", "na", 150),
  A("manzo_magro", "Manzo magro", "carne", 158, 22, 0, 7.5, 0, false, false, "basso", "na", 100),
  A("vitello", "Vitello", "carne", 107, 21, 0, 2.7, 0, false, false, "basso", "na", 100),
  A("maiale_lonza", "Lonza di maiale", "carne", 146, 21, 0, 6.8, 0, false, false, "basso", "na", 100),
  A("coniglio", "Coniglio", "carne", 118, 22, 0, 3.5, 0, false, false, "basso", "na", 100),
  A("bresaola", "Bresaola", "carne", 151, 32, 0.4, 2, 0, false, false, "basso", "na", 50),
  A("prosciutto_crudo", "Prosciutto crudo (sgrassato)", "carne", 224, 26, 0, 13, 0, false, false, "basso", "na", 50),
  A("prosciutto_cotto", "Prosciutto cotto", "carne", 132, 20, 1, 5, 0, false, false, "basso", "na", 50),

  // ---- Pesce ----
  A("salmone", "Salmone", "pesce", 208, 20, 0, 13, 0, false, false, "basso", "na", 150),
  A("merluzzo", "Merluzzo", "pesce", 82, 18, 0, 0.7, 0, false, false, "basso", "na", 150),
  A("tonno_naturale", "Tonno al naturale", "pesce", 116, 26, 0, 1, 0, false, false, "basso", "na", 100),
  A("orata", "Orata", "pesce", 121, 20, 0, 4.5, 0, false, false, "basso", "na", 150),
  A("branzino", "Branzino", "pesce", 97, 18, 0, 2.5, 0, false, false, "basso", "na", 150),
  A("sgombro", "Sgombro", "pesce", 205, 19, 0, 14, 0, false, false, "basso", "na", 120),
  A("alici", "Alici", "pesce", 96, 17, 0, 2.6, 0, false, false, "basso", "na", 100),
  A("trota", "Trota", "pesce", 119, 18, 0, 4.5, 0, false, false, "basso", "na", 150),
  A("gamberi", "Gamberi", "pesce", 85, 20, 0, 0.5, 0, false, false, "basso", "na", 150),
  A("seppia", "Seppia", "pesce", 72, 14, 0.7, 1.5, 0, false, false, "basso", "na", 150),

  // ---- Uova ----
  A("uovo", "Uovo intero", "uova", 143, 12.6, 0.7, 9.5, 0, false, false, "basso", "na", 60),
  A("albume", "Albume", "uova", 52, 11, 0.7, 0.2, 0, false, false, "basso", "na", 100),

  // ---- Latticini ----
  A("yogurt_greco", "Yogurt greco 0%", "latticini", 59, 10, 3.6, 0.4, 0, false, true, "medio", "basso", 150),
  A("skyr", "Skyr", "latticini", 63, 11, 4, 0.2, 0, false, true, "medio", "basso", 150),
  A("yogurt_bianco", "Yogurt bianco intero", "latticini", 61, 3.8, 4.9, 3.3, 0, false, true, "medio", "basso", 125),
  A("latte_scremato", "Latte scremato", "latticini", 36, 3.4, 5, 0.2, 0, false, true, "alto", "basso", 200),
  A("fiocchi_latte", "Fiocchi di latte", "latticini", 98, 11, 3.4, 4.3, 0, false, true, "medio", "basso", 100),
  A("ricotta", "Ricotta", "latticini", 146, 8.8, 3, 11, 0, false, true, "medio", "basso", 100),
  A("mozzarella", "Mozzarella", "latticini", 253, 18, 0.7, 20, 0, false, true, "basso", "na", 100),
  A("parmigiano", "Parmigiano Reggiano", "latticini", 392, 33, 0, 29, 0, false, false, "basso", "na", 30),
  A("feta", "Feta", "latticini", 264, 14, 4, 21, 0, false, true, "basso", "na", 50),

  // ---- Frutta secca & grassi ----
  A("mandorle", "Mandorle", "frutta_secca", 579, 21, 22, 49, 12.5, false, false, "medio", "basso", 30),
  A("noci", "Noci", "frutta_secca", 654, 15, 14, 65, 6.7, false, false, "basso", "basso", 30),
  A("nocciole", "Nocciole", "frutta_secca", 628, 15, 17, 61, 10, false, false, "medio", "basso", 30),
  A("pistacchi", "Pistacchi", "frutta_secca", 562, 20, 28, 45, 10, false, false, "alto", "basso", 30),
  A("semi_zucca", "Semi di zucca", "frutta_secca", 559, 30, 11, 49, 6, false, false, "basso", "basso", 20),
  A("burro_arachidi", "Burro d'arachidi", "grassi", 588, 25, 20, 50, 6, false, false, "medio", "basso", 20),
  A("olio_evo", "Olio extravergine d'oliva", "grassi", 899, 0, 0, 100, 0, false, false, "basso", "na", 10),
  A("olive", "Olive", "grassi", 145, 1, 5, 15, 3, false, false, "basso", "na", 30),
  A("cioccolato_fondente", "Cioccolato fondente 85%", "dolci", 592, 10, 19, 52, 10, false, false, "basso", "basso", 20),
];

// Indice per accesso O(1) via id.
export const ALIMENTI_BY_ID: Record<string, Alimento> = Object.fromEntries(
  ALIMENTI.map((a) => [a.id, a]),
);

/** Ruolo dell'alimento ai fini delle sostituzioni (macro guida). */
export function ruoloAlimento(a: Alimento): RuoloAlimento {
  if (a.categoria === "frutta") return "frutta";
  if (a.categoria === "verdura" && a.id !== "patate" && a.id !== "patate_dolci") return "verdura";
  if (a.categoria === "grassi" || a.categoria === "frutta_secca") return "grassi";
  if (["carne", "pesce", "uova", "legumi"].includes(a.categoria)) return "proteine";
  if (a.categoria === "latticini") return a.grassi > a.proteine ? "grassi" : "proteine";
  return "carbo"; // cereali, patate, dolci
}

const MACRO_GUIDA: Record<RuoloAlimento, "carboidrati" | "proteine" | "grassi" | "kcal"> = {
  carbo: "carboidrati", proteine: "proteine", grassi: "grassi", verdura: "kcal", frutta: "kcal",
};

/** Valori nutrizionali per una quantità arbitraria (g) di un alimento. */
export function nutriPerGrammi(id: string, grammi: number) {
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

export type Sostituto = {
  alimento: Alimento;
  grammi: number; // grammatura equivalente
  nutri: { kcal: number; proteine: number; carboidrati: number; grassi: number; fibra: number };
};

/**
 * Sostituzioni di un alimento: trova i cibi dello stesso ruolo e calcola la
 * grammatura che pareggia il macro guida (carbo→carbo, prot→prot, grassi→grassi;
 * verdura/frutta→kcal). Ordina per vicinanza calorica al pasto di partenza.
 */
export function sostituti(id: string, grammiBase: number, opts: { fodmapBasso?: boolean; senzaGlutine?: boolean; senzaLattosio?: boolean; limite?: number } = {}): Sostituto[] {
  const base = ALIMENTI_BY_ID[id];
  if (!base) return [];
  const ruolo = ruoloAlimento(base);
  const guida = MACRO_GUIDA[ruolo];
  const targetGuida = guida === "kcal" ? base.kcal * (grammiBase / 100) : (base as any)[guida] * (grammiBase / 100);
  const kcalBase = base.kcal * (grammiBase / 100);

  return ALIMENTI
    .filter((a) => a.id !== id && ruoloAlimento(a) === ruolo)
    .filter((a) => !(opts.fodmapBasso && a.fodmap !== "basso"))
    .filter((a) => !(opts.senzaGlutine && a.glutine))
    .filter((a) => !(opts.senzaLattosio && a.lattosio))
    .map((a) => {
      const per100 = guida === "kcal" ? a.kcal : (a as any)[guida];
      const grammi = per100 > 0 ? Math.round((targetGuida / per100) * 100) : a.porzioneG;
      const g = Math.max(5, grammi);
      return { alimento: a, grammi: g, nutri: nutriPerGrammi(a.id, g)! };
    })
    .sort((x, y) => Math.abs(x.nutri.kcal - kcalBase) - Math.abs(y.nutri.kcal - kcalBase))
    .slice(0, opts.limite ?? 8);
}

/** Alimenti di stagione (verdura o frutta) per un dato mese (1-12). */
export function diStagione(mese: number, categoria: "verdura" | "frutta"): Alimento[] {
  return ALIMENTI.filter((a) => a.categoria === categoria && a.stagione && a.stagione.includes(mese));
}

/** Filtra gli alimenti compatibili con le restrizioni dichiarate. */
export function filtraAlimenti(opts: {
  senzaGlutine?: boolean; senzaLattosio?: boolean; soloFodmapBasso?: boolean; vegetariano?: boolean; vegano?: boolean;
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
