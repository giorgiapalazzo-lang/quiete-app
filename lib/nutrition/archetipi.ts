// ============================================================================
// Archetipi alimentari di Quiete.
//
// A differenza del vecchio "quiz che dieta sei" (che sorteggiava un risultato
// senza effetto), qui ogni archetipo porta dati reali: ripartizione macro di
// riferimento, indicazioni, controindicazioni e regole sui cibi. Il motore
// SUGGERISCE l'archetipo dal profilo + condizioni; l'utente può cambiarlo.
//
// Nota: la ketogenica è volutamente ESCLUSA dagli archetipi self-service —
// troppe controindicazioni (diabete in terapia, gravidanza, pancreatite,
// SGLT2i, epato/nefropatie). Richiede supervisione medica.
// ============================================================================

import type { Obiettivo } from "./engine";

// Condizioni dichiarate dall'utente in fase di assessment.
export type Condizione =
  | "ibs" // sindrome intestino irritabile / gonfiore
  | "diabete_t2"
  | "celiachia"
  | "intolleranza_lattosio"
  | "ipertensione"
  | "dislipidemia" // colesterolo/trigliceridi alti
  | "gravidanza"
  | "menopausa"
  | "vegetariano"
  | "vegano";

export type ArchetipoId = "mediterranea" | "proteica" | "low_fodmap" | "plant_forward" | "dash";

export type Archetipo = {
  id: ArchetipoId;
  nome: string;
  descrizione: string;
  // Ripartizione macro di riferimento (% kcal). Il motore energetico resta la
  // fonte dei grammi; questa è la "forma" del piano quando serve orientarla.
  macroPct: { proteine: number; carboidrati: number; grassi: number };
  indicazioni: string[];
  controindicazioni: string[];
  colore: string;
};

export const ARCHETIPI: Record<ArchetipoId, Archetipo> = {
  mediterranea: {
    id: "mediterranea",
    nome: "Mediterranea bilanciata",
    descrizione:
      "Il modello di riferimento italiano: cereali integrali, legumi, verdura, pesce, olio EVO. Massima evidenza scientifica per salute cardiovascolare e longevità.",
    macroPct: { proteine: 18, carboidrati: 50, grassi: 32 },
    indicazioni: ["salute generale", "prevenzione cardiovascolare", "diabete tipo 2", "ipertensione"],
    controindicazioni: [],
    colore: "#6EBF74",
  },
  proteica: {
    id: "proteica",
    nome: "Proteica attiva",
    descrizione:
      "Più proteine per chi si allena e vuole ricomposizione o massa. Preserva il muscolo in deficit e sostiene il recupero.",
    macroPct: { proteine: 30, carboidrati: 40, grassi: 30 },
    indicazioni: ["allenamento di forza", "ricomposizione corporea", "dimagrimento con massa magra"],
    controindicazioni: ["insufficienza renale", "gravidanza (senza supervisione)"],
    colore: "#D4A55A",
  },
  low_fodmap: {
    id: "low_fodmap",
    nome: "Low-FODMAP delicata",
    descrizione:
      "Riduce i carboidrati fermentabili che causano gonfiore e fastidi intestinali. Impostata come percorso a fasi (eliminazione → reintroduzione), non definitiva.",
    macroPct: { proteine: 20, carboidrati: 45, grassi: 35 },
    indicazioni: ["IBS / colon irritabile", "gonfiore", "SIBO"],
    controindicazioni: ["disturbi del comportamento alimentare"],
    colore: "#C88BA0",
  },
  plant_forward: {
    id: "plant_forward",
    nome: "Vegetale prevalente",
    descrizione:
      "Basata su vegetali, legumi e cereali integrali, con attenzione a proteine complete, B12, ferro e omega-3.",
    macroPct: { proteine: 16, carboidrati: 54, grassi: 30 },
    indicazioni: ["vegetariani / vegani", "sostenibilità", "salute intestinale"],
    controindicazioni: ["carenze marziali non gestite"],
    colore: "#7BA05B",
  },
  dash: {
    id: "dash",
    nome: "DASH (pressione)",
    descrizione:
      "Ricca di frutta, verdura, latticini magri e povera di sodio. Nata per abbassare la pressione arteriosa.",
    macroPct: { proteine: 18, carboidrati: 55, grassi: 27 },
    indicazioni: ["ipertensione", "sindrome metabolica", "prevenzione cardiovascolare"],
    controindicazioni: [],
    colore: "#5B8DA0",
  },
};

/**
 * Suggerisce l'archetipo più adatto in base a obiettivo + condizioni.
 * Priorità: condizioni cliniche > obiettivo > default mediterranea.
 * Restituisce anche gli archetipi alternativi e le condizioni che richiedono
 * un professionista (usate per la CTA verso i nutrizionisti del team).
 */
export function suggerisciArchetipo(input: {
  obiettivo: Obiettivo;
  condizioni: Condizione[];
}): { consigliato: ArchetipoId; alternative: ArchetipoId[]; richiedeProfessionista: Condizione[] } {
  const c = new Set(input.condizioni);
  const richiedeProfessionista = input.condizioni.filter((x) =>
    (["diabete_t2", "gravidanza", "celiachia", "dislipidemia"] as Condizione[]).includes(x)
  );

  let consigliato: ArchetipoId;

  if (c.has("ibs")) consigliato = "low_fodmap";
  else if (c.has("ipertensione")) consigliato = "dash";
  else if (c.has("vegano") || c.has("vegetariano")) consigliato = "plant_forward";
  else if (input.obiettivo === "massa" || input.obiettivo === "ricomposizione") consigliato = "proteica";
  else consigliato = "mediterranea";

  const alternative = (Object.keys(ARCHETIPI) as ArchetipoId[]).filter((id) => id !== consigliato);
  return { consigliato, alternative, richiedeProfessionista };
}
