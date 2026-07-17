import type { MediaType, ScoredRecommendation } from "@/lib/types";

export const RECOMMENDATION_CATEGORIES = {
  more: {
    title: "Weitere passende Titel",
    subtitle: "Nach deinem persönlichen Score sortiert",
  },
  movies: {
    title: "Passende Filme",
    subtitle: "Für den nächsten Filmabend",
  },
  series: {
    title: "Passende Serien",
    subtitle: "Geschichten, die etwas länger bleiben",
  },
  discovery: {
    title: "Etwas Neues ausprobieren",
    subtitle: "Gut bewertet und knapp außerhalb deiner üblichen Auswahl",
  },
} as const;

export type RecommendationCategorySlug = keyof typeof RECOMMENDATION_CATEGORIES;

export function isRecommendationCategorySlug(value: string): value is RecommendationCategorySlug {
  return Object.hasOwn(RECOMMENDATION_CATEGORIES, value);
}

export function recommendationsForCategory(
  slug: RecommendationCategorySlug,
  recommendations: ScoredRecommendation[],
): ScoredRecommendation[] {
  switch (slug) {
    case "more":
      return recommendations.slice(1);
    case "movies":
      return recommendations.filter((item) => item.media.type === "movie");
    case "series":
      return recommendations.filter((item) => item.media.type === "tv");
    case "discovery":
      return recommendations.filter((item) => item.source === "discovery");
  }
}

export function categorySupportsMediaType(slug: RecommendationCategorySlug, type: MediaType): boolean {
  return (slug !== "movies" || type === "movie") && (slug !== "series" || type === "tv");
}

export function categoryTitleForMediaType(slug: RecommendationCategorySlug, type?: MediaType): string {
  const title = RECOMMENDATION_CATEGORIES[slug].title;
  if (!type || slug === "movies" || slug === "series") return title;
  return `${title} – ${type === "movie" ? "Filme" : "Serien"}`;
}
