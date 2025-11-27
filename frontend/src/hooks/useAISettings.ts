import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "rapidphotoflow-ai-settings";

interface AISettings {
  autoTagOnUpload: boolean;
}

const DEFAULT_SETTINGS: AISettings = {
  autoTagOnUpload: false, // Disabled by default due to API costs
};

export function useAISettings() {
  const [settings, setSettings] = useState<AISettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error("Failed to load AI settings:", e);
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error("Failed to save AI settings:", e);
    }
  }, [settings]);

  const setAutoTagOnUpload = useCallback((enabled: boolean) => {
    setSettings((prev) => ({ ...prev, autoTagOnUpload: enabled }));
  }, []);

  return {
    autoTagOnUpload: settings.autoTagOnUpload,
    setAutoTagOnUpload,
  };
}
