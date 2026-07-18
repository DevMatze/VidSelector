import type { Metadata } from "next";
import { getProfileLanguage } from "@/lib/data";
import { translate } from "@/lib/i18n";

export async function localizedTitle(key: string): Promise<Metadata> {
  const language = await getProfileLanguage();
  return { title: translate(language, key) };
}
