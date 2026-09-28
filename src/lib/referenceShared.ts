import criteriosCalidez from "../../data/reference/shared/criterios_calidez.json";

interface CalidezItem {
  criterio: string | null;
  nombre: string;
  pregunta: string | null;
  ponderacionSegmento: number | null;
}
interface BandaCalificacion {
  calificacion: string;
  descripcion: string;
  puntuacion: string;
}

export function markdownTable(
  headers: string[],
  rows: (string | number | null | undefined)[][]
): string {
  const clean = (v: string | number | null | undefined) =>
    String(v ?? "").replace(/\|/g, "/").replace(/\r?\n+/g, " ").trim();
  const head = `| ${headers.join(" | ")} |`;
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((r) => `| ${r.map(clean).join(" | ")} |`).join("\n");
  return `${head}\n${sep}\n${body}`;
}

/**
 * "Criterios de Calidez" (Presentación / Expresión / Despedida) is the same
 * institutional document referenced, with the identical Google Sheets URL, from the
 * Medicina General/Especialidades, Psicología and Nutrición prompts. Shared here so
 * every specialty module quotes the exact same sub-criteria, wording and score bands.
 */
export function buildCriteriosCalidezAnexo(): string {
  const calidez = criteriosCalidez as { items: CalidezItem[]; bandasCalificacion: BandaCalificacion[] };

  return `## ANEXO — Criterios de Calidez detallados (Presentación / Expresión / Despedida)
Preguntas exactas que definen cada sub-criterio y su ponderación relativa dentro del segmento. Úsalas para precisar el hallazgo de la sección "Cumplimiento de Criterios de Calidez" (Diagnóstico y Cierre se evalúan con la descripción ya dada en tus instrucciones, que no tiene un desglose adicional en este documento).

${markdownTable(
  ["Criterio", "Sub-criterio", "Pregunta orientadora", "Ponderación del segmento"],
  calidez.items.map((i) => [i.criterio, i.nombre, i.pregunta, i.ponderacionSegmento])
)}

**Bandas de calificación global:**
${markdownTable(
  ["Calificación", "Descripción", "Rango"],
  calidez.bandasCalificacion.map((b) => [b.calificacion, b.descripcion, b.puntuacion])
)}`;
}
