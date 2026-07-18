"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AppConfig } from "@/lib/config.mjs";
import { languageLocales, translate, type UiLanguage } from "@/lib/i18n";

export type PublicAppConfig = Pick<AppConfig, "recommendations" | "features" | "backups" | "users" | "localization">;

interface AppContextValue {
  language: UiLanguage;
  locale: string;
  setLanguage: (language: UiLanguage) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
  config: PublicAppConfig;
}

const defaultConfig: PublicAppConfig = {
  users: { mode: "simple" },
  localization: { default_language: "de" },
  recommendations: { show_reasons: true, homepage_limit: 50, load_batch_size: 20 },
  features: { profile_import_export: true, streaming_providers: true, trailers: true, similar_titles: true },
  backups: {
    enabled: true,
    directory: "./backups",
    before_migration: true,
    before_import: true,
    database_backups: 10,
    daily_profile_backups: 7,
    weekly_profile_backups: 4,
  },
};

const AppContext = createContext<AppContextValue>({
  language: "de",
  locale: languageLocales.de,
  setLanguage: () => undefined,
  t: (key, values) => translate("de", key, values),
  config: defaultConfig,
});

export function AppProvider({
  initialLanguage,
  config,
  children,
}: {
  initialLanguage: UiLanguage;
  config: PublicAppConfig;
  children: ReactNode;
}) {
  const [language, setLanguage] = useState(initialLanguage);
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  const value = useMemo<AppContextValue>(
    () => ({
      language,
      locale: languageLocales[language],
      setLanguage,
      t: (key, values) => translate(language, key, values),
      config,
    }),
    [config, language],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}

export const useI18n = useApp;
