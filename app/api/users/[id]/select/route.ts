import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { assertSameOrigin } from "@/lib/request-security";
import { ACTIVE_USER_COOKIE, assertMultipleUserMode, userExists } from "@/lib/users";

const paramsSchema = z.object({ id: z.string().trim().min(1).max(100) });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    assertMultipleUserMode();
    const { id } = paramsSchema.parse(await context.params);
    if (!(await userExists(id))) return NextResponse.json({ error: "Benutzer nicht gefunden." }, { status: 404 });
    const response = NextResponse.json({ selected: true, userId: id });
    response.cookies.set(ACTIVE_USER_COOKIE, id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 365 * 24 * 60 * 60,
    });
    return response;
  } catch (error) {
    return apiError(error, "Der Benutzer konnte nicht ausgewählt werden.");
  }
}
