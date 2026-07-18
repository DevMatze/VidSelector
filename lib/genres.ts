import type { Genre, MediaSummary } from "@/lib/types";
import type { UiLanguage } from "@/lib/i18n";

const GENRE_NAMES: Record<number, string> = {
  12: "Abenteuer",
  14: "Fantasy",
  16: "Animation",
  18: "Drama",
  27: "Horror",
  28: "Action",
  35: "Komödie",
  36: "Historie",
  37: "Western",
  53: "Thriller",
  80: "Krimi",
  99: "Dokumentation",
  878: "Science-Fiction",
  9648: "Mystery",
  10402: "Musik",
  10749: "Romanze",
  10751: "Familie",
  10752: "Krieg",
  10759: "Action & Abenteuer",
  10762: "Kinder",
  10763: "Nachrichten",
  10764: "Reality",
  10765: "Science-Fiction & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "Krieg & Politik",
  10770: "TV-Film",
};

const COMBINED_GENRE_FACETS: Record<number, string[]> = {
  10759: ["Action", "Abenteuer"],
  10765: ["Science-Fiction", "Fantasy"],
  10768: ["Krieg", "Politik"],
};

const LOCALIZED_GENRE_NAMES: Record<Exclude<UiLanguage, "de">, Record<string, string>> = {
  en: {
    Abenteuer: "Adventure",
    Komödie: "Comedy",
    Historie: "History",
    Krimi: "Crime",
    Dokumentation: "Documentary",
    Musik: "Music",
    Romanze: "Romance",
    Familie: "Family",
    Krieg: "War",
    Politik: "Politics",
    Kinder: "Kids",
    Nachrichten: "News",
    "TV-Film": "TV Movie",
    Sonstiges: "Other",
    "Action & Abenteuer": "Action & Adventure",
    "Krieg & Politik": "War & Politics",
  },
  es: {
    Action: "Acción",
    Abenteuer: "Aventura",
    Fantasy: "Fantasía",
    Animation: "Animación",
    Drama: "Drama",
    Horror: "Terror",
    Thriller: "Suspense",
    Komödie: "Comedia",
    Historie: "Historia",
    Krimi: "Crimen",
    Dokumentation: "Documental",
    "Science-Fiction": "Ciencia ficción",
    Mystery: "Misterio",
    Musik: "Música",
    Romanze: "Romance",
    Familie: "Familia",
    Krieg: "Bélica",
    Politik: "Política",
    Kinder: "Niños",
    Nachrichten: "Noticias",
    "TV-Film": "Película de TV",
    Sonstiges: "Otros",
    "Action & Abenteuer": "Acción y aventura",
    "Science-Fiction & Fantasy": "Ciencia ficción y fantasía",
    "Krieg & Politik": "Guerra y política",
  },
  fr: {
    Abenteuer: "Aventure",
    Fantasy: "Fantastique",
    Drama: "Drame",
    Horror: "Horreur",
    Komödie: "Comédie",
    Historie: "Histoire",
    Krimi: "Crime",
    Dokumentation: "Documentaire",
    Mystery: "Mystère",
    Musik: "Musique",
    Romanze: "Romance",
    Familie: "Familial",
    Krieg: "Guerre",
    Politik: "Politique",
    Kinder: "Kids",
    Nachrichten: "Actualités",
    "TV-Film": "Téléfilm",
    Sonstiges: "Autre",
    "Action & Abenteuer": "Action & Aventure",
    "Science-Fiction & Fantasy": "Science-Fiction & Fantastique",
    "Krieg & Politik": "Guerre & Politique",
  },
};

export function localizeGenreName(name: string, language: UiLanguage): string {
  return language === "de" ? name : (LOCALIZED_GENRE_NAMES[language][name] ?? name);
}

export function genreNameForId(id: number): string | undefined {
  return GENRE_NAMES[id];
}

export function normalizeGenres(genres: Genre[]): Genre[] {
  return genres.map((genre) => ({
    id: genre.id,
    name: GENRE_NAMES[genre.id] ?? (/^Genre \d+$/.test(genre.name) ? "Sonstiges" : genre.name),
  }));
}

export function normalizeMediaGenres<T extends MediaSummary>(media: T): T {
  const isAnime = isAnimeMedia(media);
  return {
    ...media,
    genres: normalizeGenres(media.genres).map((genre) =>
      genre.id === 16 && isAnime ? { ...genre, name: "Anime" } : genre,
    ),
  };
}

export function isAnimeMedia(media: Pick<MediaSummary, "genres" | "originalLanguage">): boolean {
  return media.originalLanguage.toLocaleLowerCase("de") === "ja" && media.genres.some((genre) => genre.id === 16);
}

export function genreFacets(genres: Genre[], originalLanguage = ""): string[] {
  const isAnime = originalLanguage.toLocaleLowerCase("de") === "ja" && genres.some((genre) => genre.id === 16);
  const facets = normalizeGenres(genres).flatMap((genre) => {
    if (genre.id === 16 && isAnime) return ["Anime"];
    return COMBINED_GENRE_FACETS[genre.id] ?? [genre.name];
  });
  return [...new Set(facets)].filter((name) => name !== "Sonstiges");
}

export function matchesGenreFilter(genres: Genre[], selectedGenre: string, originalLanguage = ""): boolean {
  if (!selectedGenre) return true;
  return genreFacets(genres, originalLanguage).includes(selectedGenre);
}

export function genreIdsMatchingQuery(query: string): number[] {
  const normalized = query.trim().toLocaleLowerCase("de");
  if (!normalized) return [];
  if ("anime".includes(normalized) || normalized.includes("anime")) return [16];
  return Object.keys(GENRE_NAMES)
    .map(Number)
    .filter((id) => {
      const names = COMBINED_GENRE_FACETS[id] ?? [GENRE_NAMES[id]];
      return names.some((name) => name.toLocaleLowerCase("de").includes(normalized));
    });
}

export function mediaGenreFacets(media: Pick<MediaSummary, "genres" | "originalLanguage">): string[] {
  return genreFacets(media.genres, media.originalLanguage);
}
