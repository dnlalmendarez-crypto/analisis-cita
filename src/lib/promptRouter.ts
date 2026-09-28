import { GENERAL_ESPECIALIDADES_PROMPT } from "./prompts/generalEspecialidadesPrompt";
import { PSICOLOGIA_PROMPT } from "./prompts/psicologiaPrompt";
import { NUEVA_CONSULTA_INSTRUCCION } from "./prompts/shared";
import { buildAnexosMarkdown } from "./referenceContext";
import { buildAnexosMarkdownPsicologia } from "./referenceContextPsicologia";
import type { SpecialtyId } from "./specialties";

const GENERAL_GROUP: SpecialtyId[] = [
  "MEDICINA_GENERAL",
  "GINECOLOGIA",
  "PEDIATRIA",
  "MEDICINA_INTERNA",
];

/**
 * Assembles the full system prompt (base audit instructions + shared "nueva consulta"
 * rule + reference anexos) for a given, already-supported specialty.
 */
export function buildSystemPrompt(specialty: SpecialtyId): string {
  if (GENERAL_GROUP.includes(specialty)) {
    const anexos = buildAnexosMarkdown(specialty);
    return `${GENERAL_ESPECIALIDADES_PROMPT}\n\n${NUEVA_CONSULTA_INSTRUCCION}\n\n${anexos}`;
  }

  if (specialty === "PSICOLOGIA") {
    const anexos = buildAnexosMarkdownPsicologia();
    return `${PSICOLOGIA_PROMPT}\n\n${NUEVA_CONSULTA_INSTRUCCION}\n\n${anexos}`;
  }

  throw new Error(`No hay un módulo de prompt configurado todavía para la especialidad: ${specialty}`);
}
