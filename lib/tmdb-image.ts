export function imageUrl(path: string | null | undefined, size: "w342" | "w500" | "original" = "w500"): string | null {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
}
