import reglasPsicologia from "../../data/reference/psicologia/reglas_auditoria_psicologia.json";
import checklistProceso from "../../data/reference/psicologia/checklist_proceso_psicologia.json";
import criteriosCalidez from "../../data/reference/psicologia/criterios_calidez_psicologia.json";

interface ReglaPsicologia {
  componente: string | null;
  criterio: string;
  indicador: string | null;
  descripcionRegla: string | null;
}
interface ChecklistItem {
  segmento: string | null;
  item: string;
}
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

function table(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const clean = (v: string | number | null | undefined) =>
    String(v ?? "").replace(/\|/g, "/").replace(/\r?\n+/g, " ").trim();
  const head = `| ${headers.join(" | ")} |`;
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((r) => `| ${r.map(clean).join(" | ")} |`).join("\n");
  return `${head}\n${sep}\n${body}`;
}

/**
 * Builds the "ANEXOS DE REFERENCIA" markdown block for the Psicología audit module.
 * Replaces the external Google Docs/Sheets links referenced in the original prompt
 * ("Criterios Unidad de Planificación y Mejora Continua - PSICOLOGIA", "Guía de
 * Consulta de Psicología calidad", "Criterios de Calidez") with the data extracted
 * from the institutional workbook uploaded for this module.
 */
export function buildAnexosMarkdownPsicologia(): string {
  const reglas = reglasPsicologia as ReglaPsicologia[];
  const checklist = checklistProceso as ChecklistItem[];
  const calidez = criteriosCalidez as { items: CalidezItem[]; bandasCalificacion: BandaCalificacion[] };

  const sections: string[] = [];

  sections.push(`## ANEXO A — Criterios de Calidad Psicológica (fuente: "Criterios Unidad de Planificación y Mejora Continua - PSICOLOGIA")
Descripción/regla e indicador esperado para cada criterio de la nota psicológica. Úsalo como referencia primaria para decidir cada fila del informe.

${table(
  ["Componente", "Criterio", "Indicador esperado", "Descripción / regla"],
  reglas.map((r) => [r.componente, r.criterio, r.indicador, r.descripcionRegla])
)}`);

  const segmentos = Array.from(new Set(checklist.map((c) => c.segmento)));
  const checklistBlock = segmentos
    .map((seg) => {
      const items = checklist.filter((c) => c.segmento === seg);
      return `**${seg}**\n${items.map((i) => `- ${i.item}`).join("\n")}`;
    })
    .join("\n\n");

  sections.push(`## ANEXO B — Checklist granular del proceso de teleconsulta psicológica
Lista de verificación operativa (además de las secciones I–VIII de la Guía de Consulta) usada por auditoría interna para validar el cumplimiento del proceso completo. Contrástala contra la Transcripción.

${checklistBlock}`);

  sections.push(`## ANEXO C — Criterios de Calidez detallados (Presentación / Expresión / Despedida)
Preguntas exactas que definen cada sub-criterio y su ponderación relativa dentro del segmento. Úsalas para precisar el hallazgo de la sección 7 (Cumplimiento de Criterios de Calidez).

${table(
  ["Criterio", "Sub-criterio", "Pregunta orientadora", "Ponderación del segmento"],
  calidez.items.map((i) => [i.criterio, i.nombre, i.pregunta, i.ponderacionSegmento])
)}

**Bandas de calificación global:**
${table(
  ["Calificación", "Descripción", "Rango"],
  calidez.bandasCalificacion.map((b) => [b.calificacion, b.descripcion, b.puntuacion])
)}`);

  return sections.join("\n\n");
}
