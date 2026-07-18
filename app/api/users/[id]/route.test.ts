import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  getActiveUserId: vi.fn(),
}));

vi.mock("@/lib/users", () => ({
  UserManagementDisabledError: class UserManagementDisabledError extends Error {},
  DefaultUserDeletionError: class DefaultUserDeletionError extends Error {},
  updateUser: mocks.updateUser,
  deleteUser: mocks.deleteUser,
  getActiveUserId: mocks.getActiveUserId,
}));

import { DELETE, PATCH } from "@/app/api/users/[id]/route";

const context = { params: Promise.resolve({ id: "user-2" }) };

describe("/api/users/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getActiveUserId.mockResolvedValue("local-user");
  });

  it("aktualisiert Name und Sprache eines Profils", async () => {
    mocks.updateUser.mockResolvedValue({ id: "user-2", name: "Gast", language: "es" });
    const response = await PATCH(
      new Request("http://localhost/api/users/user-2", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Origin: "http://localhost", Host: "localhost" },
        body: JSON.stringify({ name: "Gast", language: "es" }),
      }),
      context,
    );
    expect(response.status).toBe(200);
    expect(mocks.updateUser).toHaveBeenCalledWith("user-2", "Gast", "es");
  });

  it("löscht ein inaktives Profil samt zugehörigem Datenbereich", async () => {
    mocks.deleteUser.mockResolvedValue(true);
    const response = await DELETE(
      new Request("http://localhost/api/users/user-2", {
        method: "DELETE",
        headers: { Origin: "http://localhost", Host: "localhost" },
      }),
      context,
    );
    expect(await response.json()).toEqual({ deleted: true });
    expect(mocks.deleteUser).toHaveBeenCalledWith("user-2");
  });
});
