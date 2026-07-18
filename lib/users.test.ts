import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  userUpsert: vi.fn(),
  userFindUnique: vi.fn(),
  userUpdate: vi.fn(),
  userDelete: vi.fn(),
  userCount: vi.fn(),
  userCreate: vi.fn(),
  transaction: vi.fn(),
  deleteSearch: vi.fn(),
  deleteMedia: vi.fn(),
  invalidate: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: async () => ({ get: mocks.cookieGet }) }));
vi.mock("@/lib/config.mjs", () => ({
  appConfig: { users: { mode: "multiple" }, localization: { default_language: "de" } },
}));
vi.mock("@/lib/localized-cache", () => ({ invalidateLocalizedMediaCache: mocks.invalidate }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      upsert: mocks.userUpsert,
      findUnique: mocks.userFindUnique,
      update: mocks.userUpdate,
      delete: mocks.userDelete,
      count: mocks.userCount,
      create: mocks.userCreate,
    },
    searchCache: { deleteMany: mocks.deleteSearch },
    mediaItem: { deleteMany: mocks.deleteMedia },
    $transaction: mocks.transaction,
  },
}));

import { DefaultUserDeletionError, createUser, deleteUser, getActiveUserId, updateUser } from "@/lib/users";

describe("Mehrbenutzerverwaltung", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cookieGet.mockReturnValue({ value: "user-2" });
    mocks.userUpsert.mockResolvedValue({ id: "local-user", name: "Hauptprofil", language: "de" });
    mocks.userFindUnique.mockImplementation(async ({ where }: { where: { id: string } }) =>
      where.id === "user-2" ? { id: "user-2", name: "Zweites Profil", language: "fr" } : null,
    );
    mocks.userCount.mockResolvedValue(2);
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        user: { delete: mocks.userDelete },
        searchCache: { deleteMany: mocks.deleteSearch },
        mediaItem: { deleteMany: mocks.deleteMedia },
      }),
    );
  });

  it("verwendet den Benutzer aus dem serverseitigen Profil-Cookie", async () => {
    await expect(getActiveUserId()).resolves.toBe("user-2");
  });

  it("legt ein vollständig getrenntes Profil mit gewählter Sprache an", async () => {
    mocks.userCreate.mockResolvedValue({ id: "user-3", name: "Neu", language: "es" });
    await createUser("Neu", "es");
    expect(mocks.userCreate).toHaveBeenCalledWith({ data: { name: "Neu", language: "es" } });
  });

  it("invalidiert beim Sprachwechsel nur den Cache dieses Benutzers", async () => {
    mocks.userUpdate.mockResolvedValue({ id: "user-2", name: "Zweites Profil", language: "en" });
    await updateUser("user-2", "Zweites Profil", "en");
    expect(mocks.invalidate).toHaveBeenCalledWith("user-2");
  });

  it("schützt den ursprünglichen Benutzer vor dem Löschen", async () => {
    await expect(deleteUser("local-user")).rejects.toBeInstanceOf(DefaultUserDeletionError);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("löscht Benutzer, Suchcache und Medienbereich gemeinsam", async () => {
    await expect(deleteUser("user-2")).resolves.toBe(true);
    expect(mocks.userDelete).toHaveBeenCalledWith({ where: { id: "user-2" } });
    expect(mocks.deleteSearch).toHaveBeenCalledWith({ where: { scopeId: "user-2" } });
    expect(mocks.deleteMedia).toHaveBeenCalledWith({ where: { scopeId: "user-2" } });
  });
});
