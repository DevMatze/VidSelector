import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadConfig } from "@/lib/config.mjs";

const directories: string[] = [];

function configFile(contents: string) {
  const directory = mkdtempSync(path.join(tmpdir(), "vidselector-config-"));
  directories.push(directory);
  const file = path.join(directory, "config.yml");
  writeFileSync(file, contents);
  return file;
}

afterEach(() => {
  directories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true }));
});

describe("VidSelector-Konfiguration", () => {
  it("verwendet vollständige sichere Standardwerte ohne lokale Datei", () => {
    const config = loadConfig(path.join(tmpdir(), "nicht-vorhandene-vidselector-config.yml"));

    expect(config).toMatchObject({
      localization: { default_language: "de" },
      users: { mode: "simple" },
      server: { host: "0.0.0.0", port: 3000 },
      catalog: { force_demo: false },
      recommendations: { show_reasons: true, homepage_limit: 50, load_batch_size: 20 },
      backups: { enabled: true, before_migration: true, before_import: true },
      logging: { level: "info", log_requests: false, file: "" },
      features: {
        profile_import_export: true,
        streaming_providers: true,
        trailers: true,
        similar_titles: true,
      },
    });
  });

  it("lädt jede angebotene Einstellung aus YAML", () => {
    const config = loadConfig(
      configFile(`
localization:
  default_language: fr
users:
  mode: multiple
server:
  host: 127.0.0.1
  port: 4123
catalog:
  force_demo: true
recommendations:
  show_reasons: false
  homepage_limit: 12
  load_batch_size: 7
backups:
  enabled: false
  directory: ./safe
  before_migration: false
  before_import: false
  database_backups: 3
  daily_profile_backups: 2
  weekly_profile_backups: 1
logging:
  level: debug
  log_requests: true
  file: ./logs/test.log
features:
  profile_import_export: false
  streaming_providers: false
  trailers: false
  similar_titles: false
`),
    );

    expect(config).toEqual({
      localization: { default_language: "fr" },
      users: { mode: "multiple" },
      server: { host: "127.0.0.1", port: 4123 },
      catalog: { force_demo: true },
      recommendations: { show_reasons: false, homepage_limit: 12, load_batch_size: 7 },
      backups: {
        enabled: false,
        directory: "./safe",
        before_migration: false,
        before_import: false,
        database_backups: 3,
        daily_profile_backups: 2,
        weekly_profile_backups: 1,
      },
      logging: { level: "debug", log_requests: true, file: "./logs/test.log" },
      features: {
        profile_import_export: false,
        streaming_providers: false,
        trailers: false,
        similar_titles: false,
      },
    });
  });

  it.each([
    ["unbekannte Sprache", "localization:\n  default_language: it"],
    ["ungültiger Port", "server:\n  port: 70000"],
    ["unbekannte Option", "server:\n  public: true"],
    ["unbekannter Benutzermodus", "users:\n  mode: login"],
    ["falscher Datentyp", "features:\n  trailers: vielleicht"],
  ])("weist %s mit klarer Meldung ab", (_label, yaml) => {
    expect(() => loadConfig(configFile(yaml))).toThrow("Ungültige VidSelector-Konfiguration");
  });
});
