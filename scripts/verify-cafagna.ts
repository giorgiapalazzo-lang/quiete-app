import { calcolaSchema } from "../lib/nutrition/engine";
import { ARCHETIPI } from "../lib/nutrition/archetipi";
import { GIORGIA_CAFAGNA, CAFAGNA_TARGET } from "../lib/nutrition/__fixtures__/cafagna";

function show(label: string, p: any, archId: keyof typeof ARCHETIPI) {
  const s = calcolaSchema(p, { archetipoMacroPct: ARCHETIPI[archId].macroPct });
  console.log(
    `${label.padEnd(30)} BMR ${s.bmr} (${s.metodoBmr}) · TDEE ${s.tdee} (${s.attivitaUsata}) · ` +
      `KCAL ${s.kcalObiettivo} · P${s.macro.proteine} C${s.macro.carboidrati} G${s.macro.grassi} ` +
      `(${s.percentuali.proteine}/${s.percentuali.carboidrati}/${s.percentuali.grassi}%)`,
  );
}

console.log(`\n== Giorgia / Cafagna — target reale: ${CAFAGNA_TARGET.kcal} kcal (low_fodmap) ==\n`);
show("Con BIA (Katch) low_fodmap", GIORGIA_CAFAGNA, "low_fodmap");
show("Senza BIA (Mifflin)", { ...GIORGIA_CAFAGNA, massaGrassaPct: undefined }, "low_fodmap");

console.log("\n-- Stessa persona, archetipi diversi (kcal uguali, macro cambiano) --");
(["mediterranea", "low_fodmap", "proteica", "plant_forward", "dash"] as const).forEach((a) =>
  show(a, GIORGIA_CAFAGNA, a),
);

console.log("\n-- Sensibilità alla persona (BMI/attività/obiettivo) --");
show("Uomo 80kg attivo massa", { sesso: "uomo", eta: 35, altezzaCm: 180, pesoKg: 80, attivita: "attivo", obiettivo: "massa", allenamento: "forza", condizioni: [] }, "proteica");
show("Donna 70kg sedent. mantieni", { sesso: "donna", eta: 45, altezzaCm: 165, pesoKg: 70, attivita: "sedentario", obiettivo: "mantenimento", allenamento: "nessuno", condizioni: [] }, "mediterranea");
console.log("");
