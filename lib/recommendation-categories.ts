import type { MediaType, ScoredRecommendation } from "@/lib/types";

export const RECOMMENDATIONS_PER_MEDIA_TYPE = 50;

export const RECOMMENDATION_CATEGORIES = {
  more: {
    title: "Top-Auswahl für dich",
    subtitle: "Die stärksten Empfehlungen aus Film und Serie",
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
  additionallyExcludedKeys: ReadonlySet<string> = new Set(),
): ScoredRecommendation[] {
  const available = recommendations.slice(1).filter((item) => !additionallyExcludedKeys.has(mediaKey(item)));
  const top = takePerMediaType(available, () => true);
  const topKeys = new Set(top.map(mediaKey));
  const afterTop = available.filter((item) => !topKeys.has(mediaKey(item)));
  const movies = afterTop
    .filter((item) => item.media.type === "movie" && item.source !== "discovery")
    .slice(0, RECOMMENDATIONS_PER_MEDIA_TYPE);
  const series = afterTop
    .filter((item) => item.media.type === "tv" && item.source !== "discovery")
    .slice(0, RECOMMENDATIONS_PER_MEDIA_TYPE);
  const assignedKeys = new Set([...top, ...movies, ...series].map(mediaKey));
  const discovery = takePerMediaType(
    available.filter((item) => !assignedKeys.has(mediaKey(item))),
    () => true,
  );

  return { more: top, movies, series, discovery }[slug];
}

export function expandedRecommendationsForCategory(
  slug: RecommendationCategorySlug,
  recommendations: ScoredRecommendation[],
): ScoredRecommendation[] {
  switch (slug) {
    case "more":
      return recommendations;
    case "movies":
      return recommendations.filter((item) => item.media.type === "movie" && item.source !== "discovery");
    case "series":
      return recommendations.filter((item) => item.media.type === "tv" && item.source !== "discovery");
    case "discovery":
      return recommendations.filter((item) => item.source === "discovery");
  }
}

function takePerMediaType(
  recommendations: ScoredRecommendation[],
  predicate: (item: ScoredRecommendation) => boolean,
): ScoredRecommendation[] {
  const remaining = { movie: RECOMMENDATIONS_PER_MEDIA_TYPE, tv: RECOMMENDATIONS_PER_MEDIA_TYPE };
  return recommendations.filter((item) => {
    const type = item.media.type;
    if (!predicate(item) || remaining[type] === 0) return false;
    remaining[type] -= 1;
    return true;
  });
}

const mediaKey = (item: ScoredRecommendation) => `${item.media.type}:${item.media.tmdbId}`;

export function categorySupportsMediaType(slug: RecommendationCategorySlug, type: MediaType): boolean {
  return (slug !== "movies" || type === "movie") && (slug !== "series" || type === "tv");
}

export function categoryTitleForMediaType(slug: RecommendationCategorySlug, type?: MediaType): string {
  const title = RECOMMENDATION_CATEGORIES[slug].title;
  if (!type || slug === "movies" || slug === "series") return title;
  return `${title} – ${type === "movie" ? "Filme" : "Serien"}`;
}
