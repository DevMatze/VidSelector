import type { AppConfig } from "@/lib/config.mjs";

type BackupConfig = AppConfig["backups"];
export type ProfileBackupReason = "automatic" | "before-import" | "before-reset";

export function shouldCreateDatabaseBackup(config: BackupConfig, migration: boolean) {
  return config.enabled && (!migration || config.before_migration);
}

export function shouldCreateProfileBackup(config: BackupConfig, reason: ProfileBackupReason) {
  return config.enabled && (reason !== "before-import" || config.before_import);
}

export function databaseBackupsToDelete(files: string[], keepCount: number) {
  return files
    .filter((file) => file.endsWith(".db"))
    .sort()
    .reverse()
    .slice(keepCount);
}

export function automaticProfileBackupsToDelete(files: string[], dailyCount: number, weeklyCount: number) {
  const automatic = files
    .filter((file) => file.startsWith("automatic-") && file.endsWith(".json"))
    .sort()
    .reverse();
  const keep = new Set(automatic.slice(0, dailyCount));
  const weekly = new Set<string>();
  for (const file of automatic.slice(dailyCount)) {
    const match = file.match(/automatic-(\d{4})-(\d{2})-(\d{2})/);
    if (!match) continue;
    const date = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00Z`);
    const firstDay = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const week = `${date.getUTCFullYear()}-${Math.ceil(((date.getTime() - firstDay.getTime()) / 86_400_000 + firstDay.getUTCDay() + 1) / 7)}`;
    if (weekly.size < weeklyCount && !weekly.has(week)) {
      weekly.add(week);
      keep.add(file);
    }
  }
  return automatic.filter((file) => !keep.has(file));
}
