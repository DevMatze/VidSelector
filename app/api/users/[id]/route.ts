import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { supportedLanguages } from "@/lib/config.mjs";
import { assertSameOrigin } from "@/lib/request-security";
import { deleteUser, getActiveUserId, updateUser } from "@/lib/users";

const paramsSchema = z.object({ id: z.string().trim().min(1).max(100) });
const userSchema = z.object({
  name: z.string().trim().min(1).max(80),
  language: z.enum(supportedLanguages),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const { id } = paramsSchema.parse(await context.params);
    const body = userSchema.parse(await request.json());
    const user = await updateUser(id, body.name, body.language);
    if (!user) return NextResponse.json({ error: "Benutzer nicht gefunden." }, { status: 404 });
    return NextResponse.json({ user });
  } catch (error) {
    return apiError(error, "Der Benutzer konnte nicht aktualisiert werden.");
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const { id } = paramsSchema.parse(await context.params);
    const activeUserId = await getActiveUserId();
    const deleted = await deleteUser(id);
    const response = NextResponse.json({ deleted });
    if (deleted && activeUserId === id) response.cookies.delete("vidselector-user");
    return response;
  } catch (error) {
    return apiError(error, "Der Benutzer konnte nicht gelöscht werden.");
  }
}
