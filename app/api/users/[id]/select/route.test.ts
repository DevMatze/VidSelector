import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ userExists: vi.fn(), assertMultipleUserMode: vi.fn() }));

vi.mock("@/lib/users", () => ({
  UserManagementDisabledError: class UserManagementDisabledError extends Error {},
  DefaultUserDeletionError: class DefaultUserDeletionError extends Error {},
  ACTIVE_USER_COOKIE: "vidselector-user",
  userExists: mocks.userExists,
  assertMultipleUserMode: mocks.assertMultipleUserMode,
}));

import { POST } from "@/app/api/users/[id]/select/route";

describe("POST /api/users/[id]/select", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.userExists.mockResolvedValue(true);
  });

  it("speichert das ausgewählte Profil in einem HttpOnly-Cookie", async () => {
    const response = await POST(
      new Request("http://localhost/api/users/user-2", {
        method: "POST",
        headers: { Origin: "http://localhost", Host: "localhost" },
      }),
      { params: Promise.resolve({ id: "user-2" }) },
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ selected: true, userId: "user-2" });
    expect(response.headers.get("set-cookie")).toContain("vidselector-user=user-2");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });

  it("weist unbekannte Profile zurück", async () => {
    mocks.userExists.mockResolvedValue(false);
    const response = await POST(new Request("http://localhost/api/users/missing", { method: "POST" }), {
      params: Promise.resolve({ id: "missing" }),
    });
    expect(response.status).toBe(404);
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
