export type MediaType = "movie" | "tv";
export type RatingValue = "like" | "dislike" | "neutral";

export interface Genre {
  id: number;
  name: string;
}

export interface Person {
  id: number;
  name: string;
  role?: string;
  profilePath?: string | null;
}

export interface WatchProvider {
  id: number;
  name: string;
  logoPath?: string | null;
  kind: "flatrate" | "rent" | "buy";
}

export interface MediaSummary {
  tmdbId: number;
  type: MediaType;
  title: string;
  originalTitle?: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string;
  genres: Genre[];
  voteAverage: number;
  voteCount?: number;
  popularity: number;
  originalLanguage: string;
  bookmarked?: boolean;
}

export interface MediaDetails extends MediaSummary {
  runtime?: number;
  seasons?: number;
  episodes?: number;
  countries: string[];
  cast: Person[];
  creators: Person[];
  trailerKey?: string;
  providers: WatchProvider[];
  watchProviderUrl?: string;
  similar: MediaSummary[];
}

export interface RatingRecord {
  id: string;
  value: RatingValue;
  createdAt: string;
  updatedAt: string;
  media: MediaSummary;
  bookmarked?: boolean;
}

export interface WatchEntryRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  media: MediaSummary;
  rating?: RatingValue | null;
}

export interface TasteProfile {
  ratingCount: number;
  positiveCount: number;
  negativeCount: number;
  genreScores: Record<string, number>;
  preferredGenres: string[];
  avoidedGenres: string[];
  languageScores: Record<string, number>;
  decadeScores: Record<string, number>;
  peopleScores: Record<string, number>;
}

export interface ScoredRecommendation {
  media: MediaSummary;
  score: number;
  reasons: string[];
  source: "profile" | "similar" | "popular" | "discovery";
  bookmarked?: boolean;
}

export interface ApiError {
  error: string;
  code?: string;
}
