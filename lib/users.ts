import { cookies } from "next/headers";
import { appConfig } from "@/lib/config.mjs";
import type { UiLanguage } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { invalidateLocalizedMediaCache } from "@/lib/localized-cache";

export const DEFAULT_USER_ID = "local-user";
export const ACTIVE_USER_COOKIE = "vidselector-user";
export const isMultipleUserMode = appConfig.users.mode === "multiple";

export class UserManagementDisabledError extends Error {
  constructor() {
    super("Die Benutzerverwaltung ist in config.yml nicht aktiviert.");
    this.name = "UserManagementDisabledError";
  }
}

export class DefaultUserDeletionError extends Error {
  constructor() {
    super("Der ursprüngliche Benutzer kann nicht gelöscht werden.");
    this.name = "DefaultUserDeletionError";
  }
}

export async function ensureDefaultUser() {
  const user = await prisma.user.upsert({
    where: { id: DEFAULT_USER_ID },
    update: {},
    create: {
      id: DEFAULT_USER_ID,
      name: "Filmfan",
      language: appConfig.localization.default_language,
    },
  });
  return user.language ? user : setUserLanguage(DEFAULT_USER_ID, appConfig.localization.default_language);
}

async function requestedUserId(): Promise<string | undefined> {
  if (!isMultipleUserMode) return undefined;
  try {
    return (await cookies()).get(ACTIVE_USER_COOKIE)?.value;
  } catch {
    return undefined;
  }
}

export async function getActiveUser() {
  const fallback = await ensureDefaultUser();
  const requested = await requestedUserId();
  if (!requested || requested === DEFAULT_USER_ID) return fallback;
  return (await prisma.user.findUnique({ where: { id: requested } })) ?? fallback;
}

export async function getActiveUserId(): Promise<string> {
  return (await getActiveUser()).id;
}

export function assertMultipleUserMode() {
  if (!isMultipleUserMode) throw new UserManagementDisabledError();
}

export async function listUsers() {
  await ensureDefaultUser();
  const users = await prisma.user.findMany({
    include: {
      _count: { select: { ratings: true, recommendations: true, watchEntries: true } },
    },
    orderBy: [{ createdAt: "asc" }, { name: "asc" }],
  });
  return users.map((user) => ({
    id: user.id,
    name: user.name,
    language: user.language as UiLanguage,
    createdAt: user.createdAt.toISOString(),
    ratings: user._count.ratings,
    recommendations: user._count.recommendations,
    watchEntries: user._count.watchEntries,
    isDefault: user.id === DEFAULT_USER_ID,
  }));
}

export async function createUser(name: string, language: UiLanguage) {
  assertMultipleUserMode();
  const count = await prisma.user.count();
  if (count >= 20) throw new Error("Es können höchstens 20 Benutzer angelegt werden.");
  return prisma.user.create({ data: { name, language } });
}

export async function setUserLanguage(id: string, language: UiLanguage) {
  return prisma.user.update({ where: { id }, data: { language } });
}

export async function updateUser(id: string, name: string, language: UiLanguage) {
  assertMultipleUserMode();
  const previous = await prisma.user.findUnique({ where: { id } });
  if (!previous) return null;
  const user = await prisma.user.update({ where: { id }, data: { name, language } });
  if (previous.language !== language) await invalidateLocalizedMediaCache(id);
  return user;
}

export async function deleteUser(id: string) {
  assertMultipleUserMode();
  if (id === DEFAULT_USER_ID) throw new DefaultUserDeletionError();
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!user) return false;
  await prisma.$transaction(async (tx) => {
    await tx.user.delete({ where: { id } });
    await tx.searchCache.deleteMany({ where: { scopeId: id } });
    await tx.mediaItem.deleteMany({ where: { scopeId: id } });
  });
  return true;
}

export async function userExists(id: string): Promise<boolean> {
  if (!isMultipleUserMode) return id === DEFAULT_USER_ID;
  return Boolean(await prisma.user.findUnique({ where: { id }, select: { id: true } }));
}
