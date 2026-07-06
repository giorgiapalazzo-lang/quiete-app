// Analisi foto pasto tramite Google Gemini (tier gratuito).
// La chiave resta lato server: il client invia base64 + mime, qui parliamo con
// Gemini via REST (nessuna dipendenza npm). Env: GEMINI_API_KEY.
export const runtime = "nodejs";

type MediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";
const ALLOWED: MediaType[] = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MODEL = "gemini-2.0-flash"; // veloce, visione, disponibile nel tier gratuito

const DEFAULT_PROMPT = `Sei un dietista esperto. Analizza la foto di questo pasto e stima porzioni e valori nutrizionali usando il piatto e le posate come riferimento di scala. Rispondi SOLO con JSON valido, senza testo prima o dopo, in questo formato esatto:
{"piatto":"nome breve del piatto","alimenti":[{"nome":"alimento","grammi":120,"kcal":198,"proteine":30,"carboidrati":0,"grassi":8}],"totale":{"kcal":0,"proteine":0,"carboidrati":0,"grassi":0}}
Le grammature sono al netto degli scarti. Se nella foto non c'è cibo, restituisci "alimenti":[].`;

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "GEMINI_API_KEY non configurata sul server." }, { status: 503 });
  }

  let body: { base64?: string; mime?: string; prompt?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body JSON non valido." }, { status: 400 });
  }

  const { base64, mime, prompt } = body;
  if (!base64 || !mime) {
    return Response.json({ error: "Immagine mancante (base64 + mime richiesti)." }, { status: 400 });
  }
  if (!ALLOWED.includes(mime as MediaType)) {
    return Response.json({ error: `Formato immagine non supportato: ${mime}` }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inline_data: { mime_type: mime, data: base64 } },
                { text: prompt || DEFAULT_PROMPT },
              ],
            },
          ],
          generationConfig: { maxOutputTokens: 1024, temperature: 0.2, responseMimeType: "application/json" },
        }),
      },
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return Response.json(
        { error: `Errore Gemini (${res.status}). Verifica la chiave e il credito.`, raw: errText.slice(0, 300) },
        { status: 502 },
      );
    }

    const data = await res.json();
    const txt: string = (data?.candidates?.[0]?.content?.parts || [])
      .map((p: { text?: string }) => p.text || "")
      .join("")
      .trim();
    const clean = txt.replace(/```json|```/g, "").trim();

    try {
      return Response.json(JSON.parse(clean));
    } catch {
      return Response.json({ error: "Risposta del modello non in formato JSON.", raw: clean.slice(0, 300) }, { status: 502 });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Errore analisi immagine.";
    return Response.json({ error: msg }, { status: 502 });
  }
}
