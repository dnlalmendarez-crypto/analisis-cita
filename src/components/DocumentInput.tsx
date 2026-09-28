"use client";

import { useRef, useState } from "react";
import { ACCEPTED_EXTENSIONS } from "@/lib/fileParsing";

interface Props {
  label: string;
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  rows?: number;
}

export function DocumentInput({ label, value, onChange, placeholder, rows = 10 }: Props) {
  const [mode, setMode] = useState<"paste" | "file">("paste");
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);
    setFileName(file.name);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/extract-text", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo procesar el archivo.");
      onChange(data.text);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold">{label}</label>
        <div className="flex gap-1 text-xs">
          <button
            type="button"
            onClick={() => setMode("paste")}
            className={`rounded px-2 py-1 ${
              mode === "paste" ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" : "border border-neutral-300 dark:border-neutral-700"
            }`}
          >
            Pegar texto
          </button>
          <button
            type="button"
            onClick={() => setMode("file")}
            className={`rounded px-2 py-1 ${
              mode === "file" ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" : "border border-neutral-300 dark:border-neutral-700"
            }`}
          >
            Subir archivo
          </button>
        </div>
      </div>

      {mode === "paste" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full resize-y rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      ) : (
        <div className="rounded-md border border-dashed border-neutral-300 p-4 text-sm dark:border-neutral-700">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS.join(",")}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-md border border-neutral-300 px-3 py-1.5 dark:border-neutral-700"
          >
            Elegir archivo (.txt, .docx, .pdf)
          </button>
          {fileName && <p className="mt-2 text-neutral-500">Archivo: {fileName}</p>}
          {loading && <p className="mt-2 text-neutral-500">Extrayendo texto…</p>}
          {error && <p className="mt-2 text-red-600">{error}</p>}
          {value && !loading && (
            <details className="mt-3">
              <summary className="cursor-pointer text-neutral-500">Ver/editar texto extraído</summary>
              <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={rows}
                className="mt-2 w-full resize-y rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </details>
          )}
        </div>
      )}
    </div>
  );
}
