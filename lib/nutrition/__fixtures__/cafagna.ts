// Utente test "Giorgia / Cafagna" — banco di prova del motore nutrizionale.
// Dati reali dalla dieta Low-FODMAP di Dr.ssa V. Cafagna (1400 kcal, IBS +
// intolleranza al lattosio) e dalla BIA (massa grassa 12,7%). Serve a verificare
// che il motore riproduca ~1400 kcal e macro sensati.
import type { ProfiloNutrizionale } from "../engine";

export const GIORGIA_CAFAGNA: ProfiloNutrizionale = {
  sesso: "donna",
  eta: 30, // con massa grassa nota si usa Katch-McArdle → l'età non incide sul BMR
  altezzaCm: 152,
  pesoKg: 56.5,
  massaGrassaPct: 12.7,
  attivita: "leggero",
  obiettivo: "dimagrimento",
  allenamento: "misto",
  condizioni: ["ibs", "intolleranza_lattosio"],
};

// Riferimento reale prescritto dalla nutrizionista.
export const CAFAGNA_TARGET = { kcal: 1400, archetipo: "low_fodmap" as const };
