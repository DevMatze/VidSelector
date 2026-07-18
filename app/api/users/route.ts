import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { supportedLanguages } from "@/lib/config.mjs";
import { assertSameOrigin } from "@/lib/request-security";
import { createUser, getActiveUserId, isMultipleUserMode, listUsers } from "@/lib/users";

const userSchema = z.object({
  name: z.string().trim().min(1).max(80),
  language: z.enum(supportedLanguages),
});

export async function GET() {
  try {
    const [users, activeUserId] = await Promise.all([listUsers(), getActiveUserId()]);
    return NextResponse.json({ users, activeUserId, mode: isMultipleUserMode ? "multiple" : "simple" });
  } catch (error) {
    return apiError(error, "Die Benutzer konnten nicht geladen werden.");
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = userSchema.parse(await request.json());
    const user = await createUser(body.name, body.language);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return apiError(error, "Der Benutzer konnte nicht angelegt werden.");
  }
}
