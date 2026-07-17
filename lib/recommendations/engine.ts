import type { StoredRating } from "@/lib/data";
import type { MediaSummary, ScoredRecommendation, TasteProfile } from "@/lib/types";
import { MIN_RATINGS_FOR_PROFILE, RECOMMENDATION_WEIGHTS as W } from "@/lib/recommendations/config";
import { mediaGenreFacets } from "@/lib/genres";

export interface Candidate {
  media: MediaSummary;
  source: ScoredRecommendation["source"];
  similarTo?: Array<{ title: string; value: "like" | "dislike" }>;
  people?: string[];
}

const decade = (date: string): string => {
  const year = Number(date.slice(0, 4));
  return Number.isFinite(year) && year > 1800 ? `${Math.floor(year / 10) * 10}er` : "Unbekannt";
};

function addScore(target: Record<string, number>, key: string, score: number) {
  if (key) target[key] = (target[key] ?? 0) + score;
}

export function buildTasteProfile(ratings: StoredRating[]): TasteProfile {
  const genreScores: Record<string, number> = {};
  const languageScores: Record<string, number> = {};
  const decadeScores: Record<string, number> = {};
  const peopleScores: Record<string, number> = {};

  for (const rating of ratings) {
    const ageInDays = Math.max(0, (Date.now() - new Date(rating.updatedAt).getTime()) / 86_400_000);
    const historyWeight = Math.max(W.minimumHistoryWeight, Math.pow(0.5, ageInDays / 365));
    const modifier =
      (rating.value === "like" ? 1 : rating.value === "dislike" ? -1.2 : W.neutralRating) * historyWeight;
    for (const genre of mediaGenreFacets(rating.media)) addScore(genreScores, genre, modifier);
    addScore(languageScores, rating.media.originalLanguage, modifier);
    addScore(decadeScores, decade(rating.media.releaseDate), modifier);
    for (const person of [...(rating.metadata.cast ?? []).slice(0, 5), ...(rating.metadata.creators ?? [])]) {
      addScore(peopleScores, person.name, modifier);
    }
  }

  const sorted = Object.entries(genreScores).sort((a, b) => b[1] - a[1]);
  return {
    ratingCount: ratings.length,
    positiveCount: ratings.filter((rating) => rating.value === "like").length,
    negativeCount: ratings.filter((rating) => rating.value === "dislike").length,
    genreScores,
    preferredGenres: sorted
      .filter(([, score]) => score > 0.6)
      .slice(0, 4)
      .map(([name]) => name),
    avoidedGenres: sorted
      .filter(([, score]) => score < -0.6)
      .reverse()
      .slice(0, 4)
      .map(([name]) => name),
    languageScores,
    decadeScores,
    peopleScores,
  };
}

export function scoreRecommendations(
  ratings: StoredRating[],
  candidates: Candidate[],
): { profile: TasteProfile; recommendations: ScoredRecommendation[] } {
  const profile = buildTasteProfile(ratings);
  const rated = new Set(ratings.map((rating) => `${rating.media.type}:${rating.media.tmdbId}`));
  const unique = new Map<string, Candidate>();
  for (const candidate of candidates) {
    const key = `${candidate.media.type}:${candidate.media.tmdbId}`;
    const existing = unique.get(key);
    if (!existing || candidate.source === "similar") unique.set(key, candidate);
  }

  const recommendations = [...unique.values()]
    .filter(({ media }) => !rated.has(`${media.type}:${media.tmdbId}`))
    .map((candidate): ScoredRecommendation => {
      const { media } = candidate;
      const voteConfidence = Math.min(1, Math.log10((media.voteCount ?? 0) + 1) / 4);
      let score =
        Math.min(media.popularity / 30, W.popularityMax) +
        Math.max(0, media.voteAverage - 5) * W.publicRating * (0.35 + voteConfidence * 0.65);
      const reasons: string[] = [];
      const likedGenres: string[] = [];
      const avoidedGenres: string[] = [];

      for (const genre of mediaGenreFacets(media)) {
        const preference = profile.genreScores[genre] ?? 0;
        if (preference > 0) {
          score += preference * W.likedGenre;
          likedGenres.push(genre);
        } else if (preference < 0) {
          score += Math.abs(preference) * W.dislikedGenre;
          avoidedGenres.push(genre);
        }
      }
      const likedPeople: string[] = [];
      for (const person of candidate.people ?? []) {
        const preference = profile.peopleScores[person] ?? 0;
        if (preference > 0) {
          score += preference * W.likedPerson;
          likedPeople.push(person);
        } else if (preference < 0) score += Math.abs(preference) * W.dislikedPerson;
      }
      const language = profile.languageScores[media.originalLanguage] ?? 0;
      score += language > 0 ? language * W.likedLanguage : Math.abs(language) * W.dislikedLanguage;
      const era = profile.decadeScores[decade(media.releaseDate)] ?? 0;
      score += era > 0 ? era * W.likedDecade : Math.abs(era) * W.dislikedDecade;

      const likedAnchors = candidate.similarTo?.filter((anchor) => anchor.value === "like") ?? [];
      const dislikedAnchors = candidate.similarTo?.filter((anchor) => anchor.value === "dislike") ?? [];
      score += likedAnchors.length * W.similarToLike + dislikedAnchors.length * W.similarToDislike;
      if (likedAnchors.length)
        reasons.push(
          `Ähnlich wie ${likedAnchors
            .slice(0, 2)
            .map((item) => item.title)
            .join(" und ")}, die dir gefallen haben.`,
        );
      if (likedGenres.length)
        reasons.push(`Passt zu deinen bevorzugten Genres ${likedGenres.slice(0, 2).join(" und ")}.`);
      if (likedPeople.length)
        reasons.push(`Mit ${likedPeople.slice(0, 2).join(" und ")} aus Titeln, die dir gefallen haben.`);
      if (avoidedGenres.length && score > 0)
        reasons.push(`Trotz einzelner Überschneidungen mit ${avoidedGenres[0]} überwiegen passende Merkmale.`);
      if (media.voteAverage >= 7.5)
        reasons.push(`Von der Community stark bewertet (${media.voteAverage.toFixed(1)}/10).`);
      if (profile.ratingCount < MIN_RATINGS_FOR_PROFILE) {
        if (!reasons.length) reasons.push("Beliebter, gut bewerteter Titel für dein erstes Geschmacksprofil.");
      }
      if (media.voteAverage > 0 && media.voteAverage < 5) score += W.lowPublicRating;
      if (!reasons.length) reasons.push("Ergänzt dein bisheriges Profil um eine neue Richtung.");

      const source =
        candidate.source !== "similar" && (likedGenres.length || likedPeople.length) ? "profile" : candidate.source;
      return { media, score: Math.round(score * 10) / 10, reasons: reasons.slice(0, 3), source };
    })
    .sort((a, b) => b.score - a.score);

  const diversified: ScoredRecommendation[] = [];
  const remaining = [...recommendations];
  while (remaining.length) {
    const diversityStrength =
      profile.ratingCount < MIN_RATINGS_FOR_PROFILE ? W.diversityPenalty : W.diversityPenalty / 2;
    let bestIndex = 0;
    let bestAdjusted = Number.NEGATIVE_INFINITY;
    for (let index = 0; index < remaining.length; index += 1) {
      const facets = new Set(mediaGenreFacets(remaining[index].media));
      const recent = diversified.slice(-3);
      const overlap = recent.reduce(
        (sum, selected) => sum + mediaGenreFacets(selected.media).filter((genre) => facets.has(genre)).length,
        0,
      );
      const sameTypeRun =
        recent.length >= 2 && recent.slice(-2).every((selected) => selected.media.type === remaining[index].media.type)
          ? 1
          : 0;
      const adjusted = remaining[index].score - overlap * diversityStrength - sameTypeRun * diversityStrength;
      if (adjusted > bestAdjusted) {
        bestAdjusted = adjusted;
        bestIndex = index;
      }
    }
    diversified.push(remaining.splice(bestIndex, 1)[0]);
  }

  return { profile, recommendations: diversified };
}

export function candidatesFromRatings(ratings: StoredRating[]): Candidate[] {
  const map = new Map<string, Candidate>();
  for (const rating of ratings) {
    if (rating.value === "neutral") continue;
    for (const similar of rating.metadata.similar ?? []) {
      const key = `${similar.type}:${similar.tmdbId}`;
      const current = map.get(key) ?? ({ media: similar, source: "similar", similarTo: [] } as Candidate);
      current.similarTo!.push({ title: rating.media.title, value: rating.value === "dislike" ? "dislike" : "like" });
      map.set(key, current);
    }
  }
  return [...map.values()];
}
