import { access, mkdir, readdir, unlink } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { appConfig } from "@/lib/config.mjs";
import { databaseBackupsToDelete, shouldCreateDatabaseBackup } from "@/lib/backup-policy";

function databasePath() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl?.startsWith("file:")) throw new Error("Das Datenbank-Backup unterstützt ausschließlich SQLite.");
  const value = databaseUrl.slice("file:".length).split("?")[0];
  return path.resolve(process.cwd(), "prisma", value);
}

async function main() {
  const migrationBackup = process.argv.includes("--migration");
  if (!shouldCreateDatabaseBackup(appConfig.backups, migrationBackup)) {
    console.log("Datenbanksicherung laut config.yml übersprungen.");
    return;
  }
  const source = databasePath();
  try {
    await access(source);
  } catch {
    console.log("Noch keine SQLite-Datenbank vorhanden – Backup übersprungen.");
    return;
  }
  const directory = path.resolve(process.cwd(), appConfig.backups.directory, "database");
  await mkdir(directory, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const target = path.join(directory, `vidselector-${timestamp}.db`);
  const escapedTarget = target.replaceAll("'", "''");
  await prisma.$executeRawUnsafe(`VACUUM INTO '${escapedTarget}'`);
  const files = await readdir(directory);
  await Promise.all(
    databaseBackupsToDelete(files, appConfig.backups.database_backups).map((file) =>
      unlink(path.join(directory, file)),
    ),
  );
  console.log(`Datenbanksicherung erstellt: ${target}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
