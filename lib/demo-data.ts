import type { Genre, MediaDetails, MediaSummary } from "@/lib/types";
import { mediaGenreFacets, normalizeMediaGenres } from "@/lib/genres";

const genres: Record<string, Genre> = {
  action: { id: 28, name: "Action" },
  adventure: { id: 12, name: "Abenteuer" },
  animation: { id: 16, name: "Animation" },
  comedy: { id: 35, name: "Komödie" },
  crime: { id: 80, name: "Krimi" },
  drama: { id: 18, name: "Drama" },
  fantasy: { id: 14, name: "Fantasy" },
  history: { id: 36, name: "Historie" },
  horror: { id: 27, name: "Horror" },
  mystery: { id: 9648, name: "Mystery" },
  romance: { id: 10749, name: "Romanze" },
  scifi: { id: 878, name: "Science-Fiction" },
  thriller: { id: 53, name: "Thriller" },
  war: { id: 10752, name: "Krieg" },
  tvAdventure: { id: 10759, name: "Action & Abenteuer" },
  tvFantasy: { id: 10765, name: "Science-Fiction & Fantasy" },
  kids: { id: 10762, name: "Kinder" },
};

type DemoInput = Omit<MediaSummary, "backdropPath" | "popularity" | "originalLanguage"> & {
  backdropPath?: string | null;
  popularity?: number;
  originalLanguage?: string;
};

const item = (input: DemoInput): MediaSummary =>
  normalizeMediaGenres({
    backdropPath: input.backdropPath ?? null,
    popularity: input.popularity ?? 80,
    originalLanguage: input.originalLanguage ?? "en",
    ...input,
  });

export const DEMO_CATALOG: MediaSummary[] = [
  item({
    tmdbId: 693134,
    type: "movie",
    title: "Dune: Part Two",
    originalTitle: "Dune: Part Two",
    overview:
      "Paul Atreides verbündet sich mit Chani und den Fremen und stellt sich einer Entscheidung, die das Schicksal des Universums prägt.",
    posterPath: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    backdropPath: "/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
    releaseDate: "2024-02-27",
    genres: [genres.scifi, genres.adventure, genres.drama],
    voteAverage: 8.1,
    popularity: 210,
  }),
  item({
    tmdbId: 70523,
    type: "tv",
    title: "Dark",
    overview:
      "Das Verschwinden eines Kindes bringt die Geheimnisse einer deutschen Kleinstadt und vier miteinander verbundener Familien ans Licht.",
    posterPath: "/apbrbWs8M9lyOpJYU5WXrpFbk1Z.jpg",
    releaseDate: "2017-12-01",
    genres: [genres.scifi, genres.mystery, genres.drama],
    voteAverage: 8.4,
    originalLanguage: "de",
    popularity: 120,
  }),
  item({
    tmdbId: 66732,
    type: "tv",
    title: "Stranger Things",
    overview:
      "Eine Gruppe junger Freunde begegnet geheimen Experimenten, übernatürlichen Kräften und einem rätselhaften Mädchen.",
    posterPath: "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
    releaseDate: "2016-07-15",
    genres: [genres.scifi, genres.mystery, genres.drama],
    voteAverage: 8.6,
    popularity: 190,
  }),
  item({
    tmdbId: 27205,
    type: "movie",
    title: "Inception",
    overview: "Ein Dieb, der Geheimnisse aus Träumen stiehlt, soll einem Erben einen Gedanken einpflanzen.",
    posterPath: "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
    releaseDate: "2010-07-15",
    genres: [genres.action, genres.scifi, genres.thriller],
    voteAverage: 8.4,
    popularity: 145,
  }),
  item({
    tmdbId: 157336,
    type: "movie",
    title: "Interstellar",
    overview: "Ein Team reist durch ein Wurmloch, um eine neue Heimat für die Menschheit zu finden.",
    posterPath: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    releaseDate: "2014-11-05",
    genres: [genres.adventure, genres.drama, genres.scifi],
    voteAverage: 8.5,
    popularity: 175,
  }),
  item({
    tmdbId: 1396,
    type: "tv",
    title: "Breaking Bad",
    overview:
      "Ein Chemielehrer beginnt nach einer Krebsdiagnose, Methamphetamin herzustellen, und gerät immer tiefer in die Unterwelt.",
    posterPath: "/3xnWaLQjelJDDF7LT1WBo6f4BRe.jpg",
    releaseDate: "2008-01-20",
    genres: [genres.drama, genres.crime, genres.thriller],
    voteAverage: 8.9,
    popularity: 185,
  }),
  item({
    tmdbId: 46648,
    type: "tv",
    title: "True Detective",
    overview: "Anthologie über Ermittler, deren Fälle persönliche und philosophische Abgründe öffnen.",
    posterPath: "/cuV2O5ZyDLHSOWzg3nLVljp1ubw.jpg",
    releaseDate: "2014-01-12",
    genres: [genres.drama, genres.crime, genres.mystery],
    voteAverage: 8.3,
    popularity: 95,
  }),
  item({
    tmdbId: 335984,
    type: "movie",
    title: "Blade Runner 2049",
    overview:
      "Ein junger Blade Runner entdeckt ein lange verborgenes Geheimnis und sucht den früheren Ermittler Rick Deckard.",
    posterPath: "/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg",
    releaseDate: "2017-10-04",
    genres: [genres.scifi, genres.drama, genres.mystery],
    voteAverage: 7.6,
    popularity: 108,
  }),
  item({
    tmdbId: 76479,
    type: "tv",
    title: "The Boys",
    overview: "Eine Gruppe von Selbstjustizlern nimmt es mit korrupten Superhelden und dem Konzern hinter ihnen auf.",
    posterPath: "/2zmTngn1tYC1AvfnrFLhxeD82hz.jpg",
    releaseDate: "2019-07-25",
    genres: [genres.action, genres.scifi, genres.drama],
    voteAverage: 8.5,
    popularity: 205,
  }),
  item({
    tmdbId: 94997,
    type: "tv",
    title: "House of the Dragon",
    overview: "Der Machtkampf im Haus Targaryen führt fast zweihundert Jahre vor Game of Thrones in einen Bürgerkrieg.",
    posterPath: "/1X4h40fcB4WWUmIBK0auT4zRBAV.jpg",
    releaseDate: "2022-08-21",
    genres: [genres.drama, genres.fantasy, genres.action],
    voteAverage: 8.3,
    popularity: 180,
  }),
  item({
    tmdbId: 872585,
    type: "movie",
    title: "Oppenheimer",
    overview: "J. Robert Oppenheimer leitet das Manhattan-Projekt und muss mit den Folgen seiner Arbeit leben.",
    posterPath: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    releaseDate: "2023-07-19",
    genres: [genres.drama, genres.history],
    voteAverage: 8.0,
    popularity: 135,
  }),
  item({
    tmdbId: 438631,
    type: "movie",
    title: "Dune",
    overview:
      "Ein begabter junger Mann reist auf den gefährlichsten Planeten des Universums, um die Zukunft seiner Familie zu sichern.",
    posterPath: "/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
    releaseDate: "2021-09-15",
    genres: [genres.scifi, genres.adventure],
    voteAverage: 7.8,
    popularity: 150,
  }),
  item({
    tmdbId: 508965,
    type: "movie",
    title: "Klaus",
    overview:
      "Ein egoistischer Postbote und ein zurückgezogen lebender Spielzeugmacher bringen Freude in eine zerstrittene Stadt.",
    posterPath: "/q125RHUDgR4gjwh1QkfYuJLYkL.jpg",
    releaseDate: "2019-11-08",
    genres: [genres.animation, genres.comedy, genres.adventure],
    voteAverage: 8.2,
    popularity: 65,
  }),
  item({
    tmdbId: 194662,
    type: "tv",
    title: "The Bear",
    overview:
      "Ein junger Spitzenkoch kehrt nach Chicago zurück, um den chaotischen Sandwichladen seiner Familie zu führen.",
    posterPath: "/sHFlbKS3WLqMnp9t2ghADIJFnuQ.jpg",
    releaseDate: "2022-06-23",
    genres: [genres.drama, genres.comedy],
    voteAverage: 8.2,
    popularity: 130,
  }),
  item({
    tmdbId: 545611,
    type: "movie",
    title: "Everything Everywhere All at Once",
    overview:
      "Eine erschöpfte Waschsalonbesitzerin muss Versionen ihrer selbst aus Parallelwelten verbinden, um das Multiversum zu retten.",
    posterPath: "/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg",
    releaseDate: "2022-03-24",
    genres: [genres.action, genres.scifi, genres.comedy],
    voteAverage: 7.8,
    popularity: 75,
  }),
  item({
    tmdbId: 93405,
    type: "tv",
    title: "Squid Game",
    overview: "Verschuldete Menschen treten in tödlichen Kinderspielen um ein Vermögen an.",
    posterPath: "/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg",
    releaseDate: "2021-09-17",
    genres: [genres.action, genres.mystery, genres.drama],
    voteAverage: 7.9,
    originalLanguage: "ko",
    popularity: 220,
  }),
  item({
    tmdbId: 496243,
    type: "movie",
    title: "Parasite",
    overview: "Eine mittellose Familie schleicht sich nach und nach in das Leben einer wohlhabenden Familie ein.",
    posterPath: "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    releaseDate: "2019-05-30",
    genres: [genres.comedy, genres.thriller, genres.drama],
    voteAverage: 8.5,
    originalLanguage: "ko",
    popularity: 95,
  }),
  item({
    tmdbId: 100088,
    type: "tv",
    title: "The Last of Us",
    overview:
      "Zwanzig Jahre nach dem Zusammenbruch der Zivilisation durchqueren Joel und Ellie ein gefährliches Amerika.",
    posterPath: "/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg",
    releaseDate: "2023-01-15",
    genres: [genres.drama, genres.action, genres.scifi],
    voteAverage: 8.6,
    popularity: 165,
  }),
  item({
    tmdbId: 399566,
    type: "movie",
    title: "Godzilla vs. Kong",
    overview:
      "Zwei legendäre Titanen treffen aufeinander, während eine Verschwörung die Existenz der Kreaturen bedroht.",
    posterPath: "/pgqgaUx1cJb5oZQQ5v0tNARCeBp.jpg",
    releaseDate: "2021-03-24",
    genres: [genres.action, genres.scifi, genres.adventure],
    voteAverage: 7.6,
    popularity: 90,
  }),
  item({
    tmdbId: 80752,
    type: "tv",
    title: "See",
    overview:
      "In ferner Zukunft hat die Menschheit den Sehsinn verloren, bis Zwillinge mit der Fähigkeit zu sehen geboren werden.",
    posterPath: "/lKDIhc9FQibDiBQ57n3ELfZCyZg.jpg",
    releaseDate: "2019-11-01",
    genres: [genres.drama, genres.scifi, genres.action],
    voteAverage: 8.1,
    popularity: 78,
  }),
  item({
    tmdbId: 46260,
    type: "tv",
    title: "Naruto",
    overview: "Der junge Ninja Naruto Uzumaki verfolgt seinen Traum, Hokage seines Dorfes zu werden.",
    posterPath: null,
    releaseDate: "2002-10-03",
    genres: [genres.animation, genres.tvAdventure, genres.tvFantasy],
    voteAverage: 8.4,
    voteCount: 5000,
    originalLanguage: "ja",
    popularity: 155,
  }),
  item({
    tmdbId: 37854,
    type: "tv",
    title: "One Piece",
    overview: "Monkey D. Ruffy und seine Crew suchen auf der Grand Line nach dem legendären One Piece.",
    posterPath: null,
    releaseDate: "1999-10-20",
    genres: [genres.animation, genres.tvAdventure, genres.comedy],
    voteAverage: 8.7,
    voteCount: 6000,
    originalLanguage: "ja",
    popularity: 190,
  }),
  item({
    tmdbId: 82684,
    type: "tv",
    title: "Meine Wiedergeburt als Schleim in einer anderen Welt",
    overview: "Ein Mann wird in einer Fantasywelt als Schleim wiedergeboren und baut dort eine neue Gemeinschaft auf.",
    posterPath: null,
    releaseDate: "2018-10-02",
    genres: [genres.animation, genres.tvAdventure, genres.tvFantasy],
    voteAverage: 8.5,
    voteCount: 1200,
    originalLanguage: "ja",
    popularity: 110,
  }),
  item({
    tmdbId: 3902,
    type: "tv",
    title: "Shaun das Schaf",
    overview: "Shaun und seine Herde sorgen auf dem Bauernhof mit immer neuen Ideen für turbulente Abenteuer.",
    posterPath: null,
    releaseDate: "2007-03-05",
    genres: [genres.animation, genres.kids, genres.comedy],
    voteAverage: 7.7,
    voteCount: 300,
    originalLanguage: "en",
    popularity: 45,
  }),
];

export function searchDemo(query: string): MediaSummary[] {
  const needle = query.toLocaleLowerCase("de").trim();
  if (!needle) return DEMO_CATALOG.slice(0, 12);
  return DEMO_CATALOG.filter((media) =>
    [media.title, media.originalTitle, media.overview, ...mediaGenreFacets(media)]
      .filter(Boolean)
      .some((value) => value!.toLocaleLowerCase("de").includes(needle)),
  );
}

export function getDemoDetails(type: string, id: number): MediaDetails | null {
  const media = DEMO_CATALOG.find((entry) => entry.type === type && entry.tmdbId === id);
  if (!media) return null;

  return {
    ...media,
    runtime: media.type === "movie" ? 142 : 52,
    seasons: media.type === "tv" ? 3 : undefined,
    episodes: media.type === "tv" ? 24 : undefined,
    countries:
      media.originalLanguage === "de"
        ? ["Deutschland"]
        : media.originalLanguage === "ko"
          ? ["Südkorea"]
          : media.originalLanguage === "ja"
            ? ["Japan"]
            : ["USA"],
    cast: [
      { id: id * 10 + 1, name: "Alex Morgan", role: "Hauptrolle" },
      { id: id * 10 + 2, name: "Sam Rivera", role: "Nebenrolle" },
      { id: id * 10 + 3, name: "Jamie Chen", role: "Nebenrolle" },
    ],
    creators: [{ id: id * 10 + 4, name: "Taylor Brooks", role: media.type === "movie" ? "Regie" : "Idee" }],
    providers: [],
    similar: DEMO_CATALOG.filter(
      (candidate) =>
        candidate.type === media.type &&
        candidate.tmdbId !== id &&
        candidate.genres.some((genre) => media.genres.some((own) => own.id === genre.id)),
    ).slice(0, 15),
  };
}
