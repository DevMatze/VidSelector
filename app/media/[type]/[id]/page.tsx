import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DetailClient } from "@/components/detail-client";
import { getProfileLanguage } from "@/lib/data";
import { cacheMediaDetails, getCachedMediaDetails } from "@/lib/media-cache";
import { getMediaDetails } from "@/lib/tmdb";
import type { MediaType } from "@/lib/types";

type Props = { params: Promise<{ type: string; id: string }> };

async function parseParams(params: Props["params"]): Promise<{ type: MediaType; id: number } | null> {
  const values = await params;
  const id = Number(values.id);
  return (values.type === "movie" || values.type === "tv") && Number.isInteger(id) && id > 0
    ? { type: values.type, id }
    : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const parsed = await parseParams(params);
  if (!parsed) return {};
  try {
    const [cached, language] = await Promise.all([getCachedMediaDetails(parsed.type, parsed.id), getProfileLanguage()]);
    const media = cached ?? (await getMediaDetails(parsed.type, parsed.id, language));
    if (media && !cached) await cacheMediaDetails(media);
    return media ? { title: media.title, description: media.overview.slice(0, 160) } : {};
  } catch {
    return {};
  }
}

export default async function MediaPage({ params }: Props) {
  const parsed = await parseParams(params);
  if (!parsed) notFound();
  return <DetailClient type={parsed.type} id={String(parsed.id)} />;
}
