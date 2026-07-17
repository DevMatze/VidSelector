import { mkdir, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { exportProfileData } from "@/lib/data";

const BACKUP_INTERVAL = 24 * 60 * 60 * 1_000;
let lastAutomaticBackup = 0;
let backupPromise: Promise<string | null> | null = null;

function backupDirectory() {
  return path.join(process.cwd(), "backups", "profile");
}

function timestamp(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

async function pruneAutomaticBackups(directory: string) {
  const files = (await readdir(directory))
    .filter((file) => file.startsWith("automatic-") && file.endsWith(".json"))
    .sort()
    .reverse();
  const keep = new Set(files.slice(0, 7));
  const weekly = new Set<string>();
  for (const file of files.slice(7)) {
    const match = file.match(/automatic-(\d{4})-(\d{2})-(\d{2})/);
    if (!match) continue;
    const date = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00Z`);
    const firstDay = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const week = `${date.getUTCFullYear()}-${Math.ceil(((date.getTime() - firstDay.getTime()) / 86_400_000 + firstDay.getUTCDay() + 1) / 7)}`;
    if (weekly.size < 4 && !weekly.has(week)) {
      weekly.add(week);
      keep.add(file);
    }
  }
  await Promise.all(files.filter((file) => !keep.has(file)).map((file) => unlink(path.join(directory, file))));
}

export async function createProfileBackup(reason: "automatic" | "before-import" | "before-reset") {
  const data = await exportProfileData();
  if (data.ratings.length === 0 && data.watchEntries.length === 0) return null;
  const directory = backupDirectory();
  await mkdir(directory, { recursive: true });
  const filename = `${reason}-${timestamp()}.json`;
  const target = path.join(directory, filename);
  await writeFile(target, `${JSON.stringify(data, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  if (reason === "automatic") await pruneAutomaticBackups(directory);
  return target;
}

export async function maintainAutomaticProfileBackups() {
  if (Date.now() - lastAutomaticBackup < BACKUP_INTERVAL) return null;
  if (!backupPromise) {
    backupPromise = createProfileBackup("automatic")
      .then((result) => {
        lastAutomaticBackup = Date.now();
        return result;
      })
      .finally(() => {
        backupPromise = null;
      });
  }
  return backupPromise;
}
