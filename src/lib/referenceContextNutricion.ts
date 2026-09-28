import reglasNutricion from "../../data/reference/nutricion/reglas_auditoria_nutricion.json";
import criteriosReferenciaInterna from "../../data/reference/criterios_referencia_interna.json";
import scriptsTelemedicina from "../../data/reference/scripts_telemedicina.json";
import { buildCriteriosCalidezAnexo, markdownTable } from "./referenceShared";

interface ReglaNutricion {
  componente: string | null;
  criterio: string | null;
  indicador: string | null;
  descripcionRegla: string | null;
}
interface ReferenciaInternaItem {
  escenario: string;
  examenes: string | null;
  descripcion: string | null;
}

/**
 * Builds the "ANEXOS DE REFERENCIA" markdown block for the Nutrición audit module.
 * Replaces the external documents referenced in the original prompt ("Criterios
 * Unidad de Planificación y Mejora Continua - NUTRICION", "Criterios de referencia
 * área de Nutrición - DoctorSv", "Scripts de Telemedicina", "Criterios de Calidez")
 * with the data extracted from the institutional files uploaded for this module.
 */
export function buildAnexosMarkdownNutricion(): string {
  const reglas = reglasNutricion as ReglaNutricion[];
  const ri = criteriosReferenciaInterna as {
    NUTRICION: ReferenciaInternaItem[];
    NUTRICION_exclusion: string[];
    NUTRICION_requisitos: ReferenciaInternaItem[];
  };

  const sections: string[] = [];

  sections.push(`## ANEXO A — Criterios de Calidad de Nutrición (fuente: "Criterios Unidad de Planificación y Mejora Continua - NUTRICION")
Descripción/regla e indicador esperado para cada criterio de la nota nutricional. Úsalo como referencia primaria para decidir cada fila del informe.

${markdownTable(
  ["Componente", "Criterio", "Indicador esperado", "Descripción / regla"],
  reglas.map((r) => [r.componente, r.criterio, r.indicador, r.descripcionRegla])
)}`);

  sections.push(`## ANEXO B — Criterios de referencia área de Nutrición (Referencia Externa/Interna)
Escenarios y requisitos que justifican referir a un paciente DESDE o HACIA la especialidad de Nutrición.

### Diagnóstico/condición que justifica referencia A Nutrición
${markdownTable(
  ["Escenario", "Exámenes/requisitos", "Descripción"],
  ri.NUTRICION.map((i) => [i.escenario, i.examenes ?? "", i.descripcion ?? ""])
)}

### Criterios de exclusión para referencia a la especialidad de Nutrición
${ri.NUTRICION_exclusion.map((e) => `- ${e}`).join("\n")}

### Requisitos indispensables para referencia a Nutrición
${markdownTable(
  ["Requisito", "Detalle"],
  ri.NUTRICION_requisitos.map((i) => [i.escenario, i.descripcion ?? ""])
)}

> Nota de aplicación (Referencia Externa en Nutrición): solo se marca 🚩 cuando el Transcript confirma que el paciente ha sido visto por Nutrición durante 3 meses, cumple alguna condición de esta tabla de exclusión y era necesaria la referencia externa pero no se dejó constancia. En cualquier otro caso, este criterio se marca como "No aplica".`);

  sections.push(`## ANEXO C — Scripts de Telemedicina (guiones institucionales)
Evalúa únicamente contra la Transcripción. No exijas literalidad; exige que la idea principal de cada guion se haya cumplido. Para Nutrición, el script de bienvenida además debe incluir la solicitud de contacto y correo electrónico del paciente (ver instrucciones).

- **Script de bienvenida** (idea clave general): ${scriptsTelemedicina.bienvenida_idea_clave}
- **Script de salida** (idea clave general): ${scriptsTelemedicina.salida_idea_clave}`);

  sections.push(buildCriteriosCalidezAnexo());

  return sections.join("\n\n");
}
