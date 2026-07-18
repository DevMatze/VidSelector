import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { z } from "zod";

export const supportedLanguages = ["de", "en", "es", "fr"];

const localizationSchema = z
  .object({
    default_language: z.enum(supportedLanguages).default("de"),
  })
  .strict()
  .default({});

const usersSchema = z
  .object({
    mode: z.enum(["simple", "multiple"]).default("simple"),
  })
  .strict()
  .default({});

const serverSchema = z
  .object({
    host: z.string().trim().min(1).max(255).default("0.0.0.0"),
    port: z.number().int().min(1).max(65_535).default(3000),
  })
  .strict()
  .default({});

const catalogSchema = z
  .object({
    force_demo: z.boolean().default(false),
  })
  .strict()
  .default({});

const recommendationsSchema = z
  .object({
    show_reasons: z.boolean().default(true),
    homepage_limit: z.number().int().min(1).max(200).default(50),
    load_batch_size: z.number().int().min(1).max(100).default(20),
  })
  .strict()
  .default({});

const backupsSchema = z
  .object({
    enabled: z.boolean().default(true),
    directory: z.string().trim().min(1).default("./backups"),
    before_migration: z.boolean().default(true),
    before_import: z.boolean().default(true),
    database_backups: z.number().int().min(1).max(100).default(10),
    daily_profile_backups: z.number().int().min(1).max(31).default(7),
    weekly_profile_backups: z.number().int().min(0).max(52).default(4),
  })
  .strict()
  .default({});

const loggingSchema = z
  .object({
    level: z.enum(["error", "warn", "info", "debug"]).default("info"),
    log_requests: z.boolean().default(false),
    file: z.string().default(""),
  })
  .strict()
  .default({});

const featuresSchema = z
  .object({
    profile_import_export: z.boolean().default(true),
    streaming_providers: z.boolean().default(true),
    trailers: z.boolean().default(true),
    similar_titles: z.boolean().default(true),
  })
  .strict()
  .default({});

export const appConfigSchema = z
  .object({
    localization: localizationSchema,
    users: usersSchema,
    server: serverSchema,
    catalog: catalogSchema,
    recommendations: recommendationsSchema,
    backups: backupsSchema,
    logging: loggingSchema,
    features: featuresSchema,
  })
  .strict();

function issueText(error) {
  return error.issues.map((issue) => `${issue.path.join(".") || "Konfiguration"}: ${issue.message}`).join("; ");
}

export function loadConfig(filePath = process.env.VIDSELECTOR_CONFIG || path.join(process.cwd(), "config.yml")) {
  if (!existsSync(filePath)) return appConfigSchema.parse({});
  try {
    const document = parse(readFileSync(filePath, "utf8")) ?? {};
    return appConfigSchema.parse(document);
  } catch (error) {
    const details =
      error instanceof z.ZodError ? issueText(error) : error instanceof Error ? error.message : String(error);
    throw new Error(`Ungültige VidSelector-Konfiguration in ${filePath}: ${details}`);
  }
}

export const appConfig = loadConfig();
