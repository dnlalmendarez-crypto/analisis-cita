export type SpecialtyId =
  | "MEDICINA_GENERAL"
  | "GINECOLOGIA"
  | "PEDIATRIA"
  | "MEDICINA_INTERNA"
  | "NUTRICION"
  | "PSICOLOGIA"
  | "MEDICINA_METABOLICA";

export interface SpecialtyConfig {
  id: SpecialtyId;
  label: string;
  /** Whether an audit prompt/module has been configured for this specialty yet. */
  supported: boolean;
}

export const SPECIALTIES: SpecialtyConfig[] = [
  { id: "MEDICINA_GENERAL", label: "Medicina General", supported: true },
  { id: "GINECOLOGIA", label: "Ginecología", supported: true },
  { id: "PEDIATRIA", label: "Pediatría", supported: true },
  { id: "MEDICINA_INTERNA", label: "Medicina Interna", supported: true },
  { id: "NUTRICION", label: "Nutrición", supported: false },
  { id: "PSICOLOGIA", label: "Psicología", supported: true },
  { id: "MEDICINA_METABOLICA", label: "Medicina Metabólica", supported: false },
];

const NORMALIZED_MAP: Record<string, SpecialtyId> = {
  "medicina general": "MEDICINA_GENERAL",
  "general": "MEDICINA_GENERAL",
  "ginecologia": "GINECOLOGIA",
  "ginecologia y obstetricia": "GINECOLOGIA",
  "gineco obstetricia": "GINECOLOGIA",
  "obstetricia": "GINECOLOGIA",
  "pediatria": "PEDIATRIA",
  "medicina interna": "MEDICINA_INTERNA",
  "nutricion": "NUTRICION",
  "psicologia": "PSICOLOGIA",
  "medicina metabolica": "MEDICINA_METABOLICA",
  "metabolica": "MEDICINA_METABOLICA",
  "cronicos": "MEDICINA_METABOLICA",
};

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function normalizeSpecialtyText(raw: string): string {
  return stripAccents(raw.toLowerCase()).trim();
}

/** Try to resolve a free-text specialty (e.g. extracted from "Especialidad:" field) to a known id. */
export function resolveSpecialty(raw: string | null | undefined): SpecialtyId | null {
  if (!raw) return null;
  const norm = normalizeSpecialtyText(raw);
  if (NORMALIZED_MAP[norm]) return NORMALIZED_MAP[norm];
  for (const key of Object.keys(NORMALIZED_MAP)) {
    if (norm.includes(key)) return NORMALIZED_MAP[key];
  }
  return null;
}

export function getSpecialtyConfig(id: SpecialtyId): SpecialtyConfig {
  const found = SPECIALTIES.find((s) => s.id === id);
  if (!found) throw new Error(`Especialidad desconocida: ${id}`);
  return found;
}

/**
 * Detects the header format that marks the start of a new "Cita Médica" (per the audit
 * instructions): e.g. "Cita Médica del 2026-09-23 a las 19:00 / Diagnóstico: / Médico: / Especialidad:".
 * Returns a signature string (date+time) when found, used to know when a brand-new
 * consultation was pasted so the UI can demand a fresh transcript.
 */
export function extractCitaSignature(notaText: string): string | null {
  const match = notaText.match(
    /cita\s+m[eé]dica\s+del\s+([0-9]{4}-[0-9]{2}-[0-9]{2})\s+a\s+las\s+([0-9]{1,2}:[0-9]{2})/i
  );
  if (!match) return null;
  return `${match[1]} ${match[2]}`;
}

export function extractEspecialidadField(notaText: string): string | null {
  const match = notaText.match(/especialidad\s*:\s*([^\n\r]+)/i);
  if (!match) return null;
  const value = match[1].trim();
  return value.length > 0 ? value : null;
}
