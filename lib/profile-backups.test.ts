import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  exportProfileData: vi.fn(),
  backups: {
    enabled: true,
    directory: "",
    before_migration: true,
    before_import: true,
    database_backups: 10,
    daily_profile_backups: 7,
    weekly_profile_backups: 4,
  },
}));

vi.mock("@/lib/data", () => ({ exportProfileData: mocks.exportProfileData }));
vi.mock("@/lib/config.mjs", () => ({ appConfig: { backups: mocks.backups } }));
vi.mock("@/lib/users", () => ({ getActiveUserId: vi.fn().mockResolvedValue("local-user"), isMultipleUserMode: false }));

import { createProfileBackup } from "@/lib/profile-backups";

const directories: string[] = [];

beforeEach(() => {
  Object.assign(mocks.backups, { enabled: true, before_import: true });
  const directory = mkdtempSync(path.join(tmpdir(), "vidselector-profile-backup-"));
  directories.push(directory);
  mocks.backups.directory = directory;
  mocks.exportProfileData.mockResolvedValue({
    format: "vidselector-profile",
    version: 2,
    exportedAt: new Date().toISOString(),
    profile: { name: "Filmfan", language: "de" },
    ratings: [{ id: 1 }],
    watchEntries: [],
  });
});

afterEach(() => {
  vi.clearAllMocks();
  directories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true }));
});

describe("Profilsicherungen", () => {
  it("schreibt mit restriktiven Rechten in das konfigurierte Verzeichnis", async () => {
    const target = await createProfileBackup("before-reset");
    expect(target).toContain(path.join(mocks.backups.directory, "profile", "before-reset-"));
    expect(JSON.parse(readFileSync(target!, "utf8")).profile.language).toBe("de");
  });

  it("liest bei deaktivierter Sicherung keine Profildaten", async () => {
    mocks.backups.enabled = false;
    expect(await createProfileBackup("before-reset")).toBeNull();
    expect(mocks.exportProfileData).not.toHaveBeenCalled();
  });

  it("überspringt nur die Import-Sicherung, wenn before_import deaktiviert ist", async () => {
    mocks.backups.before_import = false;
    expect(await createProfileBackup("before-import")).toBeNull();
    expect(await createProfileBackup("before-reset")).not.toBeNull();
    expect(readdirSync(path.join(mocks.backups.directory, "profile"))).toHaveLength(1);
  });
});
