"use client";

import { useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DocumentInput } from "@/components/DocumentInput";
import { SettingsPanel } from "@/components/SettingsPanel";
import { useSettings } from "@/lib/useSettings";
import {
  SPECIALTIES,
  extractCitaSignature,
  extractEspecialidadField,
  resolveSpecialty,
  type SpecialtyId,
} from "@/lib/specialties";

type SpecialtySelection = SpecialtyId | "AUTO";

export default function Home() {
  const { settings, update, activeApiKey, activeModel } = useSettings();

  const [nota, setNota] = useState("");
  const [transcripcion, setTranscripcion] = useState("");
  const [specialtySelection, setSpecialtySelection] = useState<SpecialtySelection>("AUTO");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [newConsultaWarning, setNewConsultaWarning] = useState<string | null>(null);

  const lastSignatureRef = useRef<string | null>(null);

  const detectedEspecialidadRaw = useMemo(() => extractEspecialidadField(nota), [nota]);
  const detectedSpecialty = useMemo(
    () => resolveSpecialty(detectedEspecialidadRaw),
    [detectedEspecialidadRaw]
  );

  const effectiveSpecialty: SpecialtyId | null =
    specialtySelection === "AUTO" ? detectedSpecialty : specialtySelection;

  function handleNotaChange(text: string) {
    setNota(text);
    setReport(null);
    setError(null);
    setPendingMessage(null);

    const signature = extractCitaSignature(text);
    if (signature) {
      if (lastSignatureRef.current && lastSignatureRef.current !== signature) {
        setTranscripcion("");
        setNewConsultaWarning(
          `Se detectó una nueva consulta médica (${signature}). Sube la transcripción correspondiente a esta cita antes de analizar.`
        );
      }
      lastSignatureRef.current = signature;
    }
  }

  function handleTranscripcionChange(text: string) {
    setTranscripcion(text);
    if (text.trim()) setNewConsultaWarning(null);
  }

  const canSubmit =
    nota.trim().length > 0 &&
    transcripcion.trim().length > 0 &&
    !!effectiveSpecialty &&
    !!activeApiKey.trim() &&
    !loading;

  async function handleSubmit() {
    if (!effectiveSpecialty) {
      setError("Selecciona o deja que se detecte automáticamente la especialidad de la cita.");
      return;
    }
    setLoading(true);
    setError(null);
    setPendingMessage(null);
    setReport(null);

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-provider-api-key": activeApiKey,
        },
        body: JSON.stringify({
          nota,
          transcripcion,
          specialty: effectiveSpecialty,
          provider: settings.provider,
          model: activeModel,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ocurrió un error al generar la auditoría.");
        return;
      }
      if (data.pending) {
        setPendingMessage(data.message);
        return;
      }
      setReport(data.report);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold">Auditor de Citas Médicas</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Cotejo de la Transcripción de la videollamada contra la Nota Médica para auditoría de calidad
          en telemedicina.
        </p>
      </header>

      <SettingsPanel settings={settings} onChange={update} />

      <section className="grid gap-6 md:grid-cols-2">
        <DocumentInput
          label="Nota Médica (Registro / Historia Clínica)"
          value={nota}
          onChange={handleNotaChange}
          placeholder={`Pega aquí la nota médica, por ejemplo:\n\nCita Médica del 2026-09-23 a las 19:00\nDiagnóstico:\nMédico:\nEspecialidad:\n...`}
        />
        <DocumentInput
          label="Transcripción de la videollamada"
          value={transcripcion}
          onChange={handleTranscripcionChange}
          placeholder="Pega aquí la transcripción de la videollamada..."
        />
      </section>

      {newConsultaWarning && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          {newConsultaWarning}
        </div>
      )}

      <section className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">Especialidad</label>
          <select
            value={specialtySelection}
            onChange={(e) => setSpecialtySelection(e.target.value as SpecialtySelection)}
            className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="AUTO">Detectar automáticamente</option>
            {SPECIALTIES.map((s) => (
              <option key={s.id} value={s.id} disabled={!s.supported}>
                {s.label}
                {!s.supported ? " (próximamente)" : ""}
              </option>
            ))}
          </select>
          {specialtySelection === "AUTO" && (
            <span className="text-xs text-neutral-500">
              {detectedSpecialty
                ? `Detectada: ${SPECIALTIES.find((s) => s.id === detectedSpecialty)?.label}`
                : detectedEspecialidadRaw
                ? `Campo "Especialidad" encontrado ("${detectedEspecialidadRaw}") pero no reconocido — selecciónala manualmente.`
                : "No se detectó el campo 'Especialidad:' en la nota — selecciónala manualmente."}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-neutral-900"
        >
          {loading ? "Analizando…" : "Analizar consulta"}
        </button>
      </section>

      {!activeApiKey.trim() && (
        <p className="text-xs text-neutral-500">
          Configura tu API key en “Ajustes del proveedor de IA” arriba para poder analizar.
        </p>
      )}

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {pendingMessage && (
        <div className="rounded-md border border-blue-300 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
          {pendingMessage}
        </div>
      )}

      {report && (
        <section className="rounded-lg border border-neutral-200 p-6 dark:border-neutral-800">
          <article className="prose prose-neutral dark:prose-invert max-w-none prose-table:text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
          </article>
        </section>
      )}
    </div>
  );
}
