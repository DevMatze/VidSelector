import { DEMO_CATALOG, getDemoDetails, searchDemo } from "@/lib/demo-data";
import { genreIdsMatchingQuery, genreNameForId, normalizeMediaGenres } from "@/lib/genres";
import type { Genre, MediaDetails, MediaSummary, MediaType, Person, WatchProvider } from "@/lib/types";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const apiKey = process.env.TMDB_API_KEY?.trim();
const bearerToken = process.env.TMDB_BEARER_TOKEN?.trim();

export const isDemoMode = (!apiKey && !bearerToken) || process.env.DEMO_MODE === "true";

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
): Promise<T> {
  if (!apiKey && !bearerToken) throw new TmdbError("TMDB ist noch nicht konfiguriert.", 503);
  const url = new URL(`${TMDB_BASE_URL}${path}`);
  if (apiKey && !bearerToken) url.searchParams.set("api_key", apiKey);
  url.searchParams.set("language", "de-DE");
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

let genreMapPromise: Promise<Map<number, string>> | null = null;
async function getGenreMap(): Promise<Map<number, string>> {
  genreMapPromise ??= Promise.all([
    tmdbFetch<TmdbGenreResponse>("/genre/movie/list"),
    tmdbFetch<TmdbGenreResponse>("/genre/tv/list"),
  ])
    .then(([movies, tv]) => new Map([...movies.genres, ...tv.genres].map((genre) => [genre.id, genre.name])))
    .catch((error) => {
      genreMapPromise = null;
      throw error;
    });
  return genreMapPromise;
}

function mapSummary(raw: TmdbMedia, type: MediaType, genreMap?: Map<number, string>): MediaSummary {
  const genreList =
    raw.genres ??
    (raw.genre_ids ?? []).map((id) => ({ id, name: genreMap?.get(id) ?? genreNameForId(id) ?? "Sonstiges" }));
  return normalizeMediaGenres({
    tmdbId: raw.id,
    type,
    title: raw.title ?? raw.name ?? "Unbekannter Titel",
    originalTitle: raw.original_title ?? raw.original_name,
    overview: raw.overview || "Für diesen Titel ist noch keine Beschreibung verfügbar.",
    posterPath: raw.poster_path ?? null,
    backdropPath: raw.backdrop_path ?? null,
    releaseDate: raw.release_date ?? raw.first_air_date ?? "",
    genres: genreList,
    voteAverage: raw.vote_average ?? 0,
    voteCount: raw.vote_count ?? 0,
    popularity: raw.popularity ?? 0,
    originalLanguage: raw.original_language ?? "",
  });
}

export async function searchMedia(query: string, page = 1): Promise<{ results: MediaSummary[]; totalPages: number }> {
  if (isDemoMode) return { results: page === 1 ? searchDemo(query) : [], totalPages: 1 };
  const genreMap = await getGenreMap();
  const genreIds = query.trim().length >= 4 ? genreIdsMatchingQuery(query) : [];
  if (genreIds.length) {
    const tvSpecific = new Set([10759, 10762, 10763, 10764, 10765, 10766, 10767, 10768]);
    const movieGenre = genreIds.find((id) => !tvSpecific.has(id)) ?? genreIds[0];
    const tvGenre = genreIds.find((id) => tvSpecific.has(id)) ?? movieGenre;
    const anime = query.toLocaleLowerCase("de").includes("anime");
    const [movies, shows] = await Promise.all([
      tmdbFetch<TmdbList<TmdbMedia>>("/discover/movie", {
        with_genres: movieGenre,
        with_original_language: anime ? "ja" : undefined,
        include_adult: "false",
        page,
      }),
      tmdbFetch<TmdbList<TmdbMedia>>("/discover/tv", {
        with_genres: tvGenre,
        with_original_language: anime ? "ja" : undefined,
        include_adult: "false",
        page,
      }),
    ]);
    return {
      results: [
        ...movies.results.map((result) => mapSummary(result, "movie", genreMap)),
        ...shows.results.map((result) => mapSummary(result, "tv", genreMap)),
      ],
      totalPages: Math.min(Math.max(movies.total_pages ?? 1, shows.total_pages ?? 1), 50),
    };
  }
  const data = await tmdbFetch<TmdbList<TmdbMedia>>("/search/multi", { query, include_adult: "false", page });
  const results = data.results
    .filter((result) => result.media_type === "movie" || result.media_type === "tv")
    .map((result) => mapSummary(result, result.media_type as MediaType, genreMap));
  return { results, totalPages: Math.min(data.total_pages ?? 1, 50) };
}

export async function getMediaDetails(type: MediaType, id: number): Promise<MediaDetails | null> {
  if (isDemoMode) return getDemoDetails(type, id);
  try {
    const raw = await tmdbFetch<TmdbMedia>(`/${type}/${id}`, {
      append_to_response: "credits,videos,similar,recommendations",
    });
    const [providerData, genreMap] = await Promise.all([
      getWatchProviders(type, id).catch(() => ({ providers: [], link: undefined })),
      getGenreMap(),
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
    const trailer =
      raw.videos?.results?.find((video) => video.site === "YouTube" && video.type === "Trailer" && video.official) ??
      raw.videos?.results?.find((video) => video.site === "YouTube" && video.type === "Trailer");
    const similar = [...(raw.recommendations?.results ?? []), ...(raw.similar?.results ?? [])]
      .filter((media, index, all) => all.findIndex((entry) => entry.id === media.id) === index)
      .slice(0, 30)
      .map((media) => mapSummary(media, type, genreMap));

    return {
      ...mapSummary(raw, type),
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

async function getWatchProviders(type: MediaType, id: number): Promise<{ providers: WatchProvider[]; link?: string }> {
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
  }>(`/${type}/${id}/watch/providers`);
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
): Promise<Array<{ media: MediaSummary; source: "popular" | "discovery" }>> {
  if (isDemoMode) return DEMO_CATALOG.map((media, index) => ({ media, source: index < 8 ? "popular" : "discovery" }));
  const genreMap = await getGenreMap();
  const [movies, shows, topMovies, topShows] = await Promise.all([
    tmdbFetch<TmdbList<TmdbMedia>>("/trending/movie/week", {}, fresh),
    tmdbFetch<TmdbList<TmdbMedia>>("/trending/tv/week", {}, fresh),
    tmdbFetch<TmdbList<TmdbMedia>>("/movie/top_rated", { region: "DE", page: fresh ? 2 : 1 }, fresh),
    tmdbFetch<TmdbList<TmdbMedia>>("/tv/top_rated", { page: fresh ? 2 : 1 }, fresh),
  ]);
  return [
    ...movies.results.map((media) => ({ media: mapSummary(media, "movie", genreMap), source: "popular" as const })),
    ...shows.results.map((media) => ({ media: mapSummary(media, "tv", genreMap), source: "popular" as const })),
    ...topMovies.results.map((media) => ({
      media: mapSummary(media, "movie", genreMap),
      source: "discovery" as const,
    })),
    ...topShows.results.map((media) => ({ media: mapSummary(media, "tv", genreMap), source: "discovery" as const })),
  ];
}

export function imageUrl(path: string | null | undefined, size: "w342" | "w500" | "original" = "w500"): string | null {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
}
