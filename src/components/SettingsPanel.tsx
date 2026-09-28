"use client";

import { useState } from "react";
import type { AppSettings } from "@/lib/useSettings";

interface Props {
  settings: AppSettings;
  onChange: (patch: Partial<AppSettings>) => void;
}

export function SettingsPanel({ settings, onChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
      >
        <span>⚙️ Ajustes del proveedor de IA</span>
        <span className="text-neutral-500">{open ? "Ocultar" : "Mostrar"}</span>
      </button>
      {open && (
        <div className="space-y-4 border-t border-neutral-200 px-4 py-4 dark:border-neutral-800">
          <div>
            <label className="mb-1 block text-sm font-medium">Proveedor</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onChange({ provider: "anthropic" })}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  settings.provider === "anthropic"
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "border border-neutral-300 dark:border-neutral-700"
                }`}
              >
                Claude (Anthropic)
              </button>
              <button
                type="button"
                onClick={() => onChange({ provider: "google" })}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  settings.provider === "google"
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "border border-neutral-300 dark:border-neutral-700"
                }`}
              >
                Gemini (Google)
              </button>
            </div>
          </div>

          {settings.provider === "anthropic" ? (
            <div className="space-y-2">
              <div>
                <label className="mb-1 block text-sm font-medium">API key de Anthropic</label>
                <input
                  type="password"
                  value={settings.anthropicKey}
                  onChange={(e) => onChange({ anthropicKey: e.target.value })}
                  placeholder="sk-ant-..."
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Modelo</label>
                <input
                  type="text"
                  value={settings.anthropicModel}
                  onChange={(e) => onChange({ anthropicModel: e.target.value })}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div>
                <label className="mb-1 block text-sm font-medium">API key de Google AI (Gemini)</label>
                <input
                  type="password"
                  value={settings.googleKey}
                  onChange={(e) => onChange({ googleKey: e.target.value })}
                  placeholder="AIza..."
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Modelo</label>
                <input
                  type="text"
                  value={settings.googleModel}
                  onChange={(e) => onChange({ googleModel: e.target.value })}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>
            </div>
          )}
          <p className="text-xs text-neutral-500">
            Tu API key se guarda únicamente en este navegador (localStorage) y se envía solo a nuestro
            propio servidor para reenviarla al proveedor elegido en cada análisis. Nunca se almacena en el servidor.
          </p>
        </div>
      )}
    </div>
  );
}
