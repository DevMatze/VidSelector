export type UiLanguage = "de" | "en" | "es" | "fr";
export type LogLevel = "error" | "warn" | "info" | "debug";

export interface AppConfig {
  localization: { default_language: UiLanguage };
  users: { mode: "simple" | "multiple" };
  server: { host: string; port: number };
  catalog: { force_demo: boolean };
  recommendations: { show_reasons: boolean; homepage_limit: number; load_batch_size: number };
  backups: {
    enabled: boolean;
    directory: string;
    before_migration: boolean;
    before_import: boolean;
    database_backups: number;
    daily_profile_backups: number;
    weekly_profile_backups: number;
  };
  logging: { level: LogLevel; log_requests: boolean; file: string };
  features: {
    profile_import_export: boolean;
    streaming_providers: boolean;
    trailers: boolean;
    similar_titles: boolean;
  };
}

export const supportedLanguages: readonly ["de", "en", "es", "fr"];
export const appConfigSchema: import("zod").ZodType<AppConfig>;
export function loadConfig(filePath?: string): AppConfig;
export const appConfig: AppConfig;
