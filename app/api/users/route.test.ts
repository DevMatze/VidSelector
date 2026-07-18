import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listUsers: vi.fn(),
  getActiveUserId: vi.fn(),
  createUser: vi.fn(),
}));

vi.mock("@/lib/users", () => ({
  UserManagementDisabledError: class UserManagementDisabledError extends Error {},
  DefaultUserDeletionError: class DefaultUserDeletionError extends Error {},
  listUsers: mocks.listUsers,
  getActiveUserId: mocks.getActiveUserId,
  createUser: mocks.createUser,
  isMultipleUserMode: true,
}));

import { GET, POST } from "@/app/api/users/route";

describe("/api/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listUsers.mockResolvedValue([{ id: "local-user", name: "DevMatze" }]);
    mocks.getActiveUserId.mockResolvedValue("local-user");
  });

  it("liefert Benutzer und aktive Auswahl", async () => {
    const response = await GET();
    expect(await response.json()).toEqual({
      users: [{ id: "local-user", name: "DevMatze" }],
      activeUserId: "local-user",
      mode: "multiple",
    });
  });

  it("legt einen Benutzer mit eigener Standardsprache an", async () => {
    mocks.createUser.mockResolvedValue({ id: "user-2", name: "Gast", language: "fr" });
    const response = await POST(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "http://localhost", Host: "localhost" },
        body: JSON.stringify({ name: "Gast", language: "fr" }),
      }),
    );
    expect(response.status).toBe(201);
    expect(mocks.createUser).toHaveBeenCalledWith("Gast", "fr");
  });

  it("blockiert profiländernde Cross-Site-Anfragen", async () => {
    const response = await POST(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Sec-Fetch-Site": "cross-site" },
        body: JSON.stringify({ name: "Gast", language: "fr" }),
      }),
    );
    expect(response.status).toBe(403);
    expect(mocks.createUser).not.toHaveBeenCalled();
  });
});
