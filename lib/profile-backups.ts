import { mkdir, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { exportProfileData } from "@/lib/data";
import { appConfig } from "@/lib/config.mjs";
import {
  automaticProfileBackupsToDelete,
  shouldCreateProfileBackup,
  type ProfileBackupReason,
} from "@/lib/backup-policy";
import { getActiveUserId, isMultipleUserMode } from "@/lib/users";

const BACKUP_INTERVAL = 24 * 60 * 60 * 1_000;
const lastAutomaticBackups = new Map<string, number>();
const backupPromises = new Map<string, Promise<string | null>>();

function backupDirectory(userId: string) {
  return path.resolve(process.cwd(), appConfig.backups.directory, "profile", ...(isMultipleUserMode ? [userId] : []));
}

function timestamp(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

async function pruneAutomaticBackups(directory: string) {
  const files = await readdir(directory);
  await Promise.all(
    automaticProfileBackupsToDelete(
      files,
      appConfig.backups.daily_profile_backups,
      appConfig.backups.weekly_profile_backups,
    ).map((file) => unlink(path.join(directory, file))),
  );
}

export async function createProfileBackup(reason: ProfileBackupReason) {
  if (!shouldCreateProfileBackup(appConfig.backups, reason)) return null;
  const userId = await getActiveUserId();
  const data = await exportProfileData();
  if (data.ratings.length === 0 && data.watchEntries.length === 0) return null;
  const directory = backupDirectory(userId);
  await mkdir(directory, { recursive: true });
  const filename = `${reason}-${timestamp()}.json`;
  const target = path.join(directory, filename);
  await writeFile(target, `${JSON.stringify(data, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  if (reason === "automatic") await pruneAutomaticBackups(directory);
  return target;
}

export async function maintainAutomaticProfileBackups() {
  if (!appConfig.backups.enabled) return null;
  const userId = await getActiveUserId();
  if (Date.now() - (lastAutomaticBackups.get(userId) ?? 0) < BACKUP_INTERVAL) return null;
  if (!backupPromises.has(userId)) {
    const promise = createProfileBackup("automatic")
      .then((result) => {
        lastAutomaticBackups.set(userId, Date.now());
        return result;
      })
      .finally(() => {
        backupPromises.delete(userId);
      });
    backupPromises.set(userId, promise);
  }
  return backupPromises.get(userId)!;
}
