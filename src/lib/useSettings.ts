"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { LlmProvider } from "./llm/types";

export interface AppSettings {
  provider: LlmProvider;
  anthropicKey: string;
  googleKey: string;
  anthropicModel: string;
  googleModel: string;
}

const STORAGE_KEY = "auditor-citas:settings";

const DEFAULT_SETTINGS: AppSettings = {
  provider: "anthropic",
  anthropicKey: "",
  googleKey: "",
  anthropicModel: "claude-sonnet-5",
  googleModel: "gemini-flash-latest",
};

// Simple external store backed by localStorage, read via useSyncExternalStore so the
// server-rendered snapshot (defaults) and the post-hydration client snapshot (whatever
// is actually saved in this browser) never trigger a hydration mismatch.
let cache: AppSettings | null = null;
const listeners = new Set<() => void>();

// Gemini models retired by Google after they were saved as someone's default; map them
// forward automatically instead of leaving old browsers stuck on a dead model id.
const RETIRED_GOOGLE_MODELS: Record<string, string> = {
  "gemini-2.5-pro": "gemini-3.1-pro-preview",
};

function readFromStorage(): AppSettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
      const upgraded = RETIRED_GOOGLE_MODELS[parsed.googleModel];
      if (upgraded) parsed.googleModel = upgraded;
      return parsed;
    }
  } catch {
    // ignore corrupted storage
  }
  return DEFAULT_SETTINGS;
}

function getSnapshot(): AppSettings {
  if (cache === null) cache = readFromStorage();
  return cache;
}

function getServerSnapshot(): AppSettings {
  return DEFAULT_SETTINGS;
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function writeSettings(patch: Partial<AppSettings>) {
  const next = { ...getSnapshot(), ...patch };
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota errors
  }
  listeners.forEach((listener) => listener());
}

export function useSettings() {
  const settings = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const update = useCallback((patch: Partial<AppSettings>) => writeSettings(patch), []);

  const activeApiKey = settings.provider === "anthropic" ? settings.anthropicKey : settings.googleKey;
  const activeModel = settings.provider === "anthropic" ? settings.anthropicModel : settings.googleModel;

  return { settings, update, activeApiKey, activeModel };
}
