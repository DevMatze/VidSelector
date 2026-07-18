import { describe, expect, it } from "vitest";
import {
  automaticProfileBackupsToDelete,
  databaseBackupsToDelete,
  shouldCreateDatabaseBackup,
  shouldCreateProfileBackup,
} from "@/lib/backup-policy";
import { loadConfig } from "@/lib/config.mjs";

const defaults = () => loadConfig("/definitiv/nicht/vorhanden.yml").backups;

describe("Sicherungskonfiguration", () => {
  it("beachtet enabled, before_migration und before_import getrennt", () => {
    expect(shouldCreateDatabaseBackup(defaults(), true)).toBe(true);
    expect(shouldCreateDatabaseBackup({ ...defaults(), before_migration: false }, true)).toBe(false);
    expect(shouldCreateDatabaseBackup({ ...defaults(), before_migration: false }, false)).toBe(true);
    expect(shouldCreateProfileBackup({ ...defaults(), before_import: false }, "before-import")).toBe(false);
    expect(shouldCreateProfileBackup({ ...defaults(), before_import: false }, "before-reset")).toBe(true);
    expect(shouldCreateProfileBackup({ ...defaults(), enabled: false }, "automatic")).toBe(false);
  });

  it("begrenzt Datenbanksicherungen auf den konfigurierten Wert", () => {
    expect(databaseBackupsToDelete(["a.db", "c.db", "b.db", "note.txt"], 2)).toEqual(["a.db"]);
  });

  it("behält konfigurierte tägliche und wöchentliche Profilsicherungen", () => {
    const files = [
      "automatic-2026-07-18T10-00-00.json",
      "automatic-2026-07-17T10-00-00.json",
      "automatic-2026-07-10T10-00-00.json",
      "automatic-2026-07-03T10-00-00.json",
      "before-reset-2026.json",
    ];
    expect(automaticProfileBackupsToDelete(files, 1, 2)).toEqual(["automatic-2026-07-03T10-00-00.json"]);
    expect(automaticProfileBackupsToDelete(files, 2, 0)).toEqual([
      "automatic-2026-07-10T10-00-00.json",
      "automatic-2026-07-03T10-00-00.json",
    ]);
  });
});
