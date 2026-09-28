import patologiasSeguimiento from "../../data/reference/patologias_seguimiento_obligatorio.json";
import problemasActivos from "../../data/reference/problemas_activos_ecnt.json";
import discapacidades from "../../data/reference/discapacidades_cie11.json";
import antecedentesCriterios from "../../data/reference/antecedentes_criterios.json";
import reglasAuditoria from "../../data/reference/reglas_auditoria_2_0.json";
import criteriosEspecialidad from "../../data/reference/criterios_especialidad_matiz.json";
import criteriosReferenciaInterna from "../../data/reference/criterios_referencia_interna.json";
import scriptsTelemedicina from "../../data/reference/scripts_telemedicina.json";
import medicamentosActivos from "../../data/reference/medicamentos_activos_lom.json";
import estudiosActivos from "../../data/reference/estudios_activos.json";
import pesosCalidad from "../../data/reference/pesos_calidad.json";
import clasificacionNC from "../../data/reference/clasificacion_no_conformidad.json";
import { buildCriteriosCalidezAnexo, markdownTable } from "./referenceShared";
import type { SpecialtyId } from "./specialties";

interface PatologiaSeguimiento {
  diagnostico: string;
  cie11: string;
  seguimiento: string;
}
interface ProblemaActivo {
  cie11: string;
  diagnostico: string;
}
interface Discapacidad {
  cie11: string;
  diagnostico: string;
  casoUso: string;
}
interface AntecedenteCriterio {
  pregunta: string;
  scorePorcentaje: number | string;
  dondeBuscar: string | null;
  rangoEdad: string | null;
  genero: string | null;
  primeraConsulta: string | null;
  subsecuente: string | null;
  excepcionesConsultaRapida: string | null;
}
interface ReglaAuditoria {
  componente: string | null;
  criterio: string;
  descripcion: string;
  reglas: string;
  fuente: string | null;
  logica: string | null;
}
interface CriterioEspecialidadRow {
  componente: string;
  criterio: string;
  descripcion: string;
  MEDICINA_INTERNA: string | null;
  GINECOLOGIA: string | null;
  PEDIATRIA: string | null;
  PSICOLOGIA: string | null;
  NUTRICION: string | null;
}
interface ReferenciaInternaItem {
  escenario: string;
  examenes: string | null;
  descripcion: string | null;
}
interface CriteriosReferenciaInterna {
  MEDICINA_INTERNA: ReferenciaInternaItem[];
  GINECOLOGIA: ReferenciaInternaItem[];
  GINECOLOGIA_nota: string;
  PEDIATRIA: ReferenciaInternaItem[];
  PSICOLOGIA: string;
  NUTRICION: ReferenciaInternaItem[];
  NUTRICION_exclusion: string[];
  NUTRICION_requisitos: ReferenciaInternaItem[];
}
interface PesoCalidad {
  componente: string | null;
  criterio: string;
  pesoPorcentaje: number | string;
  autoFail: string | null;
  impacto: string | null;
}
interface ClasificacionNCRow {
  componente: string | null;
  criterio: string;
  MEDICINA_GENERAL: string;
  MEDICINA_METABOLICA: string;
  MEDICINA_INTERNA: string;
  GINECOLOGIA: string;
  PEDIATRIA: string;
  NUTRICION: string;
  PSICOLOGIA: string;
}

const SPECIALTY_COLUMN: Partial<Record<SpecialtyId, keyof CriterioEspecialidadRow>> = {
  MEDICINA_INTERNA: "MEDICINA_INTERNA",
  GINECOLOGIA: "GINECOLOGIA",
  PEDIATRIA: "PEDIATRIA",
};

const NC_COLUMN: Record<SpecialtyId, keyof ClasificacionNCRow> = {
  MEDICINA_GENERAL: "MEDICINA_GENERAL",
  MEDICINA_INTERNA: "MEDICINA_INTERNA",
  GINECOLOGIA: "GINECOLOGIA",
  PEDIATRIA: "PEDIATRIA",
  NUTRICION: "NUTRICION",
  PSICOLOGIA: "PSICOLOGIA",
  MEDICINA_METABOLICA: "MEDICINA_METABOLICA",
};

const table = markdownTable;

function referenciaInternaBlock(title: string, items: ReferenciaInternaItem[]): string {
  if (!items.length) return "";
  return `### ${title}\n${table(
    ["Escenario", "Exámenes de referencia", "Descripción / criterio clínico"],
    items.map((i) => [i.escenario, i.examenes ?? "No requiere", i.descripcion ?? ""])
  )}`;
}

/**
 * Builds the full "ANEXOS DE REFERENCIA" markdown block that is appended to the base
 * audit prompt. It replaces the Google Sheets/Docs links mentioned in the original
 * prompt (not reachable at runtime) with the equivalent data extracted from the
 * institutional reference files uploaded for this module.
 */
export function buildAnexosMarkdown(specialty: SpecialtyId): string {
  const ri = criteriosReferenciaInterna as CriteriosReferenciaInterna;
  const reglas = reglasAuditoria as ReglaAuditoria[];
  const especialidadRows = criteriosEspecialidad as CriterioEspecialidadRow[];
  const pesos = pesosCalidad as PesoCalidad[];
  const ncRows = clasificacionNC as ClasificacionNCRow[];
  const ncCol = NC_COLUMN[specialty];

  const sections: string[] = [];

  sections.push(`## ANEXO A — Reglas detalladas de auditoría por criterio (v2.0)
Fuente institucional que precisa, criterio por criterio, la descripción, la regla de cumplimiento y la lógica de decisión (✅/🚩). Úsala como referencia primaria para decidir cada fila del informe.

${(reglas)
  .map(
    (r) =>
      `**${r.componente ? r.componente + " — " : ""}${r.criterio.replace(/\n/g, " ")}**\n- Descripción: ${r.descripcion.replace(/\n/g, " ")}\n- Regla: ${r.reglas.replace(/\n/g, " ")}\n- Lógica de decisión: ${(r.logica ?? "").replace(/\n/g, " ")}`
  )
  .join("\n\n")}`);

  const specialtyCol = SPECIALTY_COLUMN[specialty];
  if (specialtyCol) {
    const rows = especialidadRows.filter((r) => r[specialtyCol]);
    if (rows.length) {
      sections.push(`## ANEXO B — Matices del criterio para la especialidad detectada (${specialty})
Excepciones o aclaraciones que aplican a esta especialidad y pueden modificar cómo se evalúa un criterio del Anexo A.

${table(
  ["Componente", "Criterio", "Matiz para esta especialidad"],
  rows.map((r) => [r.componente, r.criterio, r[specialtyCol] ?? ""])
)}`);
    }
  }

  sections.push(`## ANEXO C — Clasificación del hallazgo (No Conformidad vs. Evento de Riesgo)
Cuando un criterio se marque como incumplido (🚩), indica también su clasificación institucional para la especialidad detectada.

${table(
  ["Componente", "Criterio", `Clasificación (${specialty})`],
  ncRows.map((r) => [r.componente, r.criterio, r[ncCol]])
)}`);

  sections.push(`## ANEXO D — Patologías de seguimiento obligatorio
Si el diagnóstico (principal o secundario) coincide con esta lista, el seguimiento (verbal Y escrito) es obligatorio; su ausencia es 🚩.

${table(
  ["Diagnóstico", "CIE-11", "Seguimiento según GPC"],
  (patologiasSeguimiento as PatologiaSeguimiento[]).map((p) => [p.diagnostico, p.cie11, p.seguimiento])
)}`);

  sections.push(`## ANEXO E — Enfermedades crónicas que deben registrarse como "Problema Activo"
Si el paciente refiere o se diagnostica alguna de estas condiciones, debe constar en la sección de Problemas Activos de la nota médica.

${table(
  ["CIE-11", "Diagnóstico"],
  (problemasActivos as ProblemaActivo[]).map((p) => [p.cie11, p.diagnostico])
)}`);

  sections.push(`## ANEXO F — Códigos CIE-11 de discapacidad (uso exclusivo como diagnóstico secundario)

${table(
  ["CIE-11", "Diagnóstico oficial", "Caso de uso"],
  (discapacidades as Discapacidad[]).map((d) => [d.cie11, d.diagnostico, d.casoUso])
)}`);

  const riBlocks = [
    referenciaInternaBlock("Medicina Interna", ri.MEDICINA_INTERNA),
    referenciaInternaBlock("Ginecología y Obstetricia", ri.GINECOLOGIA) +
      (ri.GINECOLOGIA_nota ? `\n\n> ${ri.GINECOLOGIA_nota.replace(/\n+/g, " ")}` : ""),
    referenciaInternaBlock("Pediatría", ri.PEDIATRIA),
    `### Psicología\n${ri.PSICOLOGIA}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  sections.push(`## ANEXO G — Criterios y exámenes para justificar Referencia Interna por especialidad
Úsalo para validar si una Referencia Interna (o la ausencia de ella) está clínicamente justificada, y si los exámenes solicitados corresponden a lo exigido para esa referencia.

${riBlocks}`);

  sections.push(`## ANEXO H — Scripts de Telemedicina (guiones institucionales)
Evalúa únicamente contra la Transcripción. No exijas literalidad; exige que la idea principal de cada guion se haya cumplido.

- **Script de bienvenida** (idea clave): ${scriptsTelemedicina.bienvenida_idea_clave}
- **Script de salida** (idea clave): ${scriptsTelemedicina.salida_idea_clave}
- **Constancia médica con tratamiento**: ${scriptsTelemedicina.constanciaMedica.conTratamientoYConstancia}
- **Paciente insiste en incapacidad**: ${scriptsTelemedicina.constanciaMedica.pacienteInsisteEnIncapacidad}
- **Orden de imágenes** (idea clave): ${scriptsTelemedicina.ordenImagenes.idea_clave}
- **Orden de receta** (idea clave): ${scriptsTelemedicina.ordenReceta.idea_clave}
- **Orden de laboratorio** (idea clave): ${scriptsTelemedicina.ordenLaboratorio.idea_clave}
- **Recetas con medicamentos inyectables** (idea clave): ${scriptsTelemedicina.recetaInyectables.idea_clave}`);

  sections.push(`## ANEXO I — Preguntas de antecedentes esperadas (guía de cobertura)

${table(
  ["Pregunta orientadora", "¿Obligatoria en 1ª consulta?", "¿Obligatoria en subsecuente?", "Rango de edad", "Género"],
  (antecedentesCriterios as AntecedenteCriterio[]).map((a) => [
    a.pregunta,
    a.primeraConsulta,
    a.subsecuente,
    a.rangoEdad,
    a.genero,
  ])
)}`);

  sections.push(`## ANEXO J — Listado de Medicamentos Oficiales (LOM) activos
No está permitido sugerir la compra de un medicamento fuera de este listado; si el médico prescribe algo fuera de él sin justificación, es 🚩.

${(medicamentosActivos as string[]).join(", ")}`);

  const estudios = estudiosActivos as { laboratorio: string[]; imagenes: string[]; accionesPresenciales: string[] };
  sections.push(`## ANEXO K — Catálogo de estudios activos
**Laboratorio:** ${estudios.laboratorio.join(", ")}

**Imágenes:** ${estudios.imagenes.join(", ")}`);

  sections.push(`## ANEXO L — Ponderación de calidad por criterio (referencia para el resumen ejecutivo)
Peso relativo de cada criterio sobre el total de la nota (útil para priorizar qué hallazgos son más graves). "AUTO FAIL" implica que, de fallar, el criterio compromete gravemente la calificación total independientemente de los demás.

${table(
  ["Componente", "Criterio", "Peso %", "¿Auto-fail?"],
  pesos.map((p) => [p.componente, p.criterio, typeof p.pesoPorcentaje === "number" ? `${(p.pesoPorcentaje * 100).toFixed(1)}%` : p.pesoPorcentaje, p.autoFail ?? "n/a"])
)}`);

  sections.push(buildCriteriosCalidezAnexo());

  return sections.join("\n\n");
}
