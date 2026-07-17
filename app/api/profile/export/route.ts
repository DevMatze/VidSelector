import { apiError } from "@/lib/api-response";
import { exportProfileData } from "@/lib/data";

export async function GET() {
  try {
    const data = await exportProfileData();
    const date = new Date().toISOString().slice(0, 10);
    return new Response(`${JSON.stringify(data, null, 2)}\n`, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="vidselector-profile-${date}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return apiError(error, "Der Datenexport konnte nicht erstellt werden.");
  }
}
