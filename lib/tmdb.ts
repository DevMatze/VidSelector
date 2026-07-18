import { DEMO_CATALOG, getDemoDetails, searchDemo } from "@/lib/demo-data";
import { genreIdsMatchingQuery, genreNameForId, localizeGenreName, normalizeMediaGenres } from "@/lib/genres";
import type { Genre, MediaDetails, MediaSummary, MediaType, Person, RatingValue, WatchProvider } from "@/lib/types";
import { appConfig } from "@/lib/config.mjs";
import { languageLocales, translate, type UiLanguage } from "@/lib/i18n";
import { applyConfiguredMediaFeatures, mediaDetailRequestPlan, mediaFeatureFingerprint } from "@/lib/media-features";
export { imageUrl } from "@/lib/tmdb-image";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const apiKey = process.env.TMDB_API_KEY?.trim();
const bearerToken = process.env.TMDB_BEARER_TOKEN?.trim();

export function determineDemoMode(credentials: { apiKey?: string; bearerToken?: string }, forceDemo: boolean) {
  return (!credentials.apiKey && !credentials.bearerToken) || forceDemo;
}

export const isDemoMode = determineDemoMode({ apiKey, bearerToken }, appConfig.catalog.force_demo);

export class TmdbError extends Error {
  constructor(
    message: string,
    public readonly status = 502,
  ) {
    super(message);
    this.name = "TmdbError";
  }
}

async function tmdbFetch<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
  fresh = false,
  language: UiLanguage = "de",
): Promise<T> {
  if (!apiKey && !bearerToken) throw new TmdbError("TMDB ist noch nicht konfiguriert.", 503);
  const url = new URL(`${TMDB_BASE_URL}${path}`);
  if (apiKey && !bearerToken) url.searchParams.set("api_key", apiKey);
  url.searchParams.set("language", languageLocales[language]);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...(fresh ? { cache: "no-store" as const } : { next: { revalidate: 900 } }),
      ...(bearerToken ? { headers: { Authorization: `Bearer ${bearerToken}` } } : {}),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new TmdbError("TMDB ist gerade nicht erreichbar. Bitte versuche es später erneut.");
  }
  if (!response.ok) {
    throw new TmdbError(
      response.status === 401 ? "Der TMDB-API-Schlüssel ist ungültig." : "TMDB konnte die Anfrage nicht verarbeiten.",
      response.status,
    );
  }
  return response.json() as Promise<T>;
}

interface TmdbList<T> {
  results: T[];
  page?: number;
  total_pages?: number;
}
interface TmdbGenreResponse {
  genres: Genre[];
}
interface TmdbMedia {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  genres?: Genre[];
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  original_language?: string;
  runtime?: number;
  episode_run_time?: number[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  production_countries?: Array<{ name: string }>;
  credits?: {
    cast?: Array<{ id: number; name: string; character?: string; profile_path?: string | null }>;
    crew?: Array<{ id: number; name: string; job?: string; department?: string; profile_path?: string | null }>;
  };
  created_by?: Array<{ id: number; name: string; profile_path?: string | null }>;
  videos?: { results?: Array<{ key: string; site: string; type: string; official?: boolean }> };
  similar?: TmdbList<TmdbMedia>;
  recommendations?: TmdbList<TmdbMedia>;
  [key: string]: unknown;
}

const genreMapPromises = new Map<UiLanguage, Promise<Map<number, string>>>();
async function getGenreMap(language: UiLanguage): Promise<Map<number, string>> {
  const existing = genreMapPromises.get(language);
  if (existing) return existing;
  const request = Promise.all([
    tmdbFetch<TmdbGenreResponse>("/genre/movie/list", {}, false, language),
    tmdbFetch<TmdbGenreResponse>("/genre/tv/list", {}, false, language),
  ])
    .then(([movies, tv]) => new Map([...movies.genres, ...tv.genres].map((genre) => [genre.id, genre.name])))
    .catch((error) => {
      genreMapPromises.delete(language);
      throw error;
    });
  genreMapPromises.set(language, request);
  return request;
}

function mapSummary(
  raw: TmdbMedia,
  type: MediaType,
  genreMap?: Map<number, string>,
  language: UiLanguage = "de",
): MediaSummary {
  const genreList =
    raw.genres ??
    (raw.genre_ids ?? []).map((id) => ({ id, name: genreMap?.get(id) ?? genreNameForId(id) ?? "Sonstiges" }));
  const normalized = normalizeMediaGenres({
    tmdbId: raw.id,
    type,
    title: raw.title ?? raw.name ?? translate(language, "content.unknownTitle"),
    originalTitle: raw.original_title ?? raw.original_name,
    overview: raw.overview || translate(language, "content.noDescription"),
    posterPath: raw.poster_path ?? null,
    backdropPath: raw.backdrop_path ?? null,
    releaseDate: raw.release_date ?? raw.first_air_date ?? "",
    genres: genreList,
    voteAverage: raw.vote_average ?? 0,
    voteCount: raw.vote_count ?? 0,
    popularity: raw.popularity ?? 0,
    originalLanguage: raw.original_language ?? "",
  });
  return {
    ...normalized,
    genres: normalized.genres.map((genre) => {
      if (genre.name === "Anime") return genre;
      const canonicalName = genreNameForId(genre.id);
      return {
        ...genre,
        name: canonicalName ? localizeGenreName(canonicalName, language) : (genreMap?.get(genre.id) ?? genre.name),
      };
    }),
  };
}

export interface RelatedMediaAnchor {
  type: MediaType;
  tmdbId: number;
  value: RatingValue;
}

export interface RelatedMediaCandidate {
  media: MediaSummary;
  source: "similar";
  similarTo: Array<{ title: string; value: "like" | "dislike" }>;
}

export async function getRelatedCandidatePool(
  anchors: RelatedMediaAnchor[],
  language: UiLanguage = "de",
): Promise<RelatedMediaCandidate[]> {
  if (isDemoMode) return [];
  const selected = [
    ...anchors.filter((anchor) => anchor.value === "like").slice(0, 10),
    ...anchors.filter((anchor) => anchor.value === "dislike").slice(0, 5),
  ];
  if (!selected.length) return [];
  const genreMap = await getGenreMap(language);
  const responses: Array<{ anchor: RelatedMediaAnchor; raw: TmdbMedia } | null> = [];
  for (let index = 0; index < selected.length; index += 4) {
    const batch = selected.slice(index, index + 4);
    responses.push(
      ...(await Promise.all(
        batch.map(async (anchor) => {
          try {
            const raw = await tmdbFetch<TmdbMedia>(
              `/${anchor.type}/${anchor.tmdbId}`,
              { append_to_response: "recommendations,similar" },
              false,
              language,
            );
            return { anchor, raw };
          } catch {
            return null;
          }
        }),
      )),
    );
  }

  const candidates = new Map<string, RelatedMediaCandidate>();
  for (const response of responses) {
    if (!response) continue;
    const anchorTitle = mapSummary(response.raw, response.anchor.type, genreMap, language).title;
    const related = [...(response.raw.recommendations?.results ?? []), ...(response.raw.similar?.results ?? [])].filter(
      (media, index, all) => all.findIndex((entry) => entry.id === media.id) === index,
    );
    for (const raw of related) {
      const media = mapSummary(raw, response.anchor.type, genreMap, language);
      const key = `${media.type}:${media.tmdbId}`;
      const candidate =
        candidates.get(key) ?? ({ media, source: "similar", similarTo: [] } satisfies RelatedMediaCandidate);
      candidate.similarTo.push({
        title: anchorTitle,
        value: response.anchor.value === "dislike" ? "dislike" : "like",
      });
      candidates.set(key, candidate);
    }
  }
  return [...candidates.values()];
}

export async function searchMedia(
  query: string,
  page = 1,
  language: UiLanguage = "de",
): Promise<{ results: MediaSummary[]; totalPages: number }> {
  if (isDemoMode) return { results: page === 1 ? searchDemo(query) : [], totalPages: 1 };
  const genreMap = await getGenreMap(language);
  const genreIds = query.trim().length >= 4 ? genreIdsMatchingQuery(query) : [];
  if (genreIds.length) {
    const tvSpecific = new Set([10759, 10762, 10763, 10764, 10765, 10766, 10767, 10768]);
    const movieGenre = genreIds.find((id) => !tvSpecific.has(id)) ?? genreIds[0];
    const tvGenre = genreIds.find((id) => tvSpecific.has(id)) ?? movieGenre;
    const anime = query.toLocaleLowerCase("de").includes("anime");
    const [movies, shows] = await Promise.all([
      tmdbFetch<TmdbList<TmdbMedia>>(
        "/discover/movie",
        {
          with_genres: movieGenre,
          with_original_language: anime ? "ja" : undefined,
          include_adult: "false",
          page,
        },
        false,
        language,
      ),
      tmdbFetch<TmdbList<TmdbMedia>>(
        "/discover/tv",
        {
          with_genres: tvGenre,
          with_original_language: anime ? "ja" : undefined,
          include_adult: "false",
          page,
        },
        false,
        language,
      ),
    ]);
    return {
      results: [
        ...movies.results.map((result) => mapSummary(result, "movie", genreMap, language)),
        ...shows.results.map((result) => mapSummary(result, "tv", genreMap, language)),
      ],
      totalPages: Math.min(Math.max(movies.total_pages ?? 1, shows.total_pages ?? 1), 50),
    };
  }
  const data = await tmdbFetch<TmdbList<TmdbMedia>>(
    "/search/multi",
    { query, include_adult: "false", page },
    false,
    language,
  );
  const results = data.results
    .filter((result) => result.media_type === "movie" || result.media_type === "tv")
    .map((result) => mapSummary(result, result.media_type as MediaType, genreMap, language));
  return { results, totalPages: Math.min(data.total_pages ?? 1, 50) };
}

export async function getMediaDetails(
  type: MediaType,
  id: number,
  language: UiLanguage = "de",
): Promise<MediaDetails | null> {
  if (isDemoMode) {
    const details = getDemoDetails(type, id);
    return details ? applyConfiguredMediaFeatures(details) : null;
  }
  try {
    const requestPlan = mediaDetailRequestPlan(appConfig.features);
    const raw = await tmdbFetch<TmdbMedia>(
      `/${type}/${id}`,
      { append_to_response: requestPlan.appendedResponses.join(",") },
      false,
      language,
    );
    const [providerData, genreMap] = await Promise.all([
      requestPlan.fetchProviders
        ? getWatchProviders(type, id, language).catch(() => ({ providers: [], link: undefined }))
        : Promise.resolve({ providers: [], link: undefined }),
      getGenreMap(language),
    ]);
    const cast: Person[] = (raw.credits?.cast ?? []).slice(0, 12).map((person) => ({
      id: person.id,
      name: person.name,
      role: person.character,
      profilePath: person.profile_path,
    }));
    const directors = (raw.credits?.crew ?? [])
      .filter(
        (person) =>
          person.job === "Director" || person.job === "Executive Producer" || person.department === "Directing",
      )
      .slice(0, 6)
      .map((person) => ({ id: person.id, name: person.name, role: person.job, profilePath: person.profile_path }));
    const creators =
      type === "tv"
        ? (raw.created_by ?? []).map((person) => ({
            id: person.id,
            name: person.name,
            role: "Idee",
            profilePath: person.profile_path,
          }))
        : directors;
    const trailer = appConfig.features.trailers
      ? (raw.videos?.results?.find((video) => video.site === "YouTube" && video.type === "Trailer" && video.official) ??
        raw.videos?.results?.find((video) => video.site === "YouTube" && video.type === "Trailer"))
      : undefined;
    const similar = appConfig.features.similar_titles
      ? [...(raw.recommendations?.results ?? []), ...(raw.similar?.results ?? [])]
          .filter((media, index, all) => all.findIndex((entry) => entry.id === media.id) === index)
          .slice(0, 30)
          .map((media) => mapSummary(media, type, genreMap, language))
      : [];

    return {
      ...mapSummary(raw, type, genreMap, language),
      featureFingerprint: mediaFeatureFingerprint,
      runtime: raw.runtime ?? raw.episode_run_time?.[0],
      seasons: raw.number_of_seasons,
      episodes: raw.number_of_episodes,
      countries: (raw.production_countries ?? []).map((country) => country.name),
      cast,
      creators,
      trailerKey: trailer?.key,
      providers: providerData.providers,
      watchProviderUrl: providerData.link,
      similar,
    };
  } catch (error) {
    if (error instanceof TmdbError && error.status === 404) return null;
    throw error;
  }
}

async function getWatchProviders(
  type: MediaType,
  id: number,
  language: UiLanguage,
): Promise<{ providers: WatchProvider[]; link?: string }> {
  const data = await tmdbFetch<{
    results?: Record<
      string,
      {
        link?: string;
        flatrate?: Array<{ provider_id: number; provider_name: string; logo_path?: string }>;
        rent?: Array<{ provider_id: number; provider_name: string; logo_path?: string }>;
        buy?: Array<{ provider_id: number; provider_name: string; logo_path?: string }>;
      }
    >;
  }>(`/${type}/${id}/watch/providers`, {}, false, language);
  const region = data.results?.DE;
  if (!region) return { providers: [] };
  return {
    link: region.link,
    providers: (["flatrate", "rent", "buy"] as const).flatMap((kind) =>
      (region[kind] ?? []).map((provider) => ({
        id: provider.provider_id,
        name: provider.provider_name,
        logoPath: provider.logo_path,
        kind,
      })),
    ),
  };
}

export async function getCandidatePool(
  fresh = false,
  language: UiLanguage = "de",
): Promise<Array<{ media: MediaSummary; source: "popular" | "discovery" }>> {
  if (isDemoMode) return DEMO_CATALOG.map((media, index) => ({ media, source: index < 8 ? "popular" : "discovery" }));
  const genreMap = await getGenreMap(language);
  const pages = Array.from({ length: 5 }, (_, index) => index + 1);
  const [movies, shows, topMovies, topShows] = await Promise.all([
    fetchCandidatePages("/trending/movie/week", pages, fresh, language),
    fetchCandidatePages("/trending/tv/week", pages, fresh, language),
    fetchCandidatePages("/movie/top_rated", pages, fresh, language, { region: "DE" }),
    fetchCandidatePages("/tv/top_rated", pages, fresh, language),
  ]);
  return [
    ...movies.map((media) => ({ media: mapSummary(media, "movie", genreMap, language), source: "popular" as const })),
    ...shows.map((media) => ({ media: mapSummary(media, "tv", genreMap, language), source: "popular" as const })),
    ...topMovies.map((media) => ({
      media: mapSummary(media, "movie", genreMap, language),
      source: "discovery" as const,
    })),
    ...topShows.map((media) => ({ media: mapSummary(media, "tv", genreMap, language), source: "discovery" as const })),
  ];
}

async function fetchCandidatePages(
  path: string,
  pages: number[],
  fresh: boolean,
  language: UiLanguage,
  params: Record<string, string | number | undefined> = {},
): Promise<TmdbMedia[]> {
  const responses = await Promise.all(
    pages.map((page) => tmdbFetch<TmdbList<TmdbMedia>>(path, { ...params, page }, fresh, language)),
  );
  return responses.flatMap((response) => response.results);
}
