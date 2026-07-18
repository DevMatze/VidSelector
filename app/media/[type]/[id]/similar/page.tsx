import { notFound } from "next/navigation";
import { SimilarClient } from "@/components/similar-client";
import { appConfig } from "@/lib/config.mjs";
import type { MediaType } from "@/lib/types";
import { localizedTitle } from "@/lib/localized-metadata";

export const generateMetadata = () => localizedTitle("similar.eyebrow");

export default async function SimilarPage({ params }: { params: Promise<{ type: string; id: string }> }) {
  if (!appConfig.features.similar_titles) notFound();
  const { type, id } = await params;
  const numericId = Number(id);
  if ((type !== "movie" && type !== "tv") || !Number.isInteger(numericId) || numericId <= 0) notFound();
  return <SimilarClient type={type as MediaType} id={numericId} />;
}
