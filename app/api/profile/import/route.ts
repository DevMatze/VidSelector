import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { importProfileData } from "@/lib/data";
import { createProfileBackup } from "@/lib/profile-backups";
import { profileImportRequestSchema } from "@/lib/profile-transfer";
import { assertSameOrigin, enforceRateLimit } from "@/lib/request-security";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, "profile-import", 5, 60_000);
    const body = profileImportRequestSchema.parse(await request.json());
    const backup = await createProfileBackup("before-import");
    const imported = await importProfileData(body.data, body.mode);
    return NextResponse.json({ imported, backupCreated: Boolean(backup) });
  } catch (error) {
    return apiError(error, "Der Datenimport konnte nicht abgeschlossen werden.");
  }
}
