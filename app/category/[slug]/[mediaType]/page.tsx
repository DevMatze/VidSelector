import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryClient } from "@/components/category-client";
import {
  categorySupportsMediaType,
  categoryTitleForMediaType,
  isRecommendationCategorySlug,
  RECOMMENDATION_CATEGORIES,
} from "@/lib/recommendation-categories";
import type { MediaType } from "@/lib/types";

interface Props {
  params: Promise<{ slug: string; mediaType: string }>;
}

function parseParams(
  slug: string,
  mediaType: string,
): { slug: keyof typeof RECOMMENDATION_CATEGORIES; mediaType: MediaType } | null {
  if (!isRecommendationCategorySlug(slug) || (mediaType !== "movie" && mediaType !== "tv")) return null;
  if (!categorySupportsMediaType(slug, mediaType)) return null;
  return { slug, mediaType };
}

export function generateStaticParams() {
  return Object.keys(RECOMMENDATION_CATEGORIES).flatMap((slug) =>
    ["movie", "tv"].filter((mediaType) => parseParams(slug, mediaType)).map((mediaType) => ({ slug, mediaType })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const values = await params;
  const parsed = parseParams(values.slug, values.mediaType);
  return parsed ? { title: categoryTitleForMediaType(parsed.slug, parsed.mediaType) } : {};
}

export default async function CategoryMediaPage({ params }: Props) {
  const values = await params;
  const parsed = parseParams(values.slug, values.mediaType);
  if (!parsed) notFound();
  return <CategoryClient slug={parsed.slug} mediaType={parsed.mediaType} />;
}
