import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { getProfile, getRatings, resetProfile, updateProfileName } from "@/lib/data";
import { buildTasteProfile } from "@/lib/recommendations/engine";
import { assertSameOrigin } from "@/lib/request-security";
import { maintainMediaCache } from "@/lib/media-cache";

const profileSchema = z.object({ name: z.string().trim().min(1).max(80) });

export async function GET(request: Request) {
  try {
    await maintainMediaCache();
    if (new URL(request.url).searchParams.get("summary") === "1") {
      return NextResponse.json({ profile: await getProfile() });
    }
    const [profile, ratings] = await Promise.all([getProfile(), getRatings()]);
    return NextResponse.json({ profile, taste: buildTasteProfile(ratings) });
  } catch (error) {
    return apiError(error, "Das Profil konnte nicht geladen werden.");
  }
}

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    const { name } = profileSchema.parse(await request.json());
    const profile = await updateProfileName(name);
    return NextResponse.json({ profile });
  } catch (error) {
    return apiError(error, "Das Profil konnte nicht aktualisiert werden.");
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    await resetProfile();
    return NextResponse.json({ reset: true });
  } catch (error) {
    return apiError(error, "Das Profil konnte nicht zurückgesetzt werden.");
  }
}
