import Image from "next/image";
import { Film } from "lucide-react";
import { imageUrl } from "@/lib/tmdb";

export function MediaPoster({
  path,
  title,
  priority = false,
}: {
  path: string | null;
  title: string;
  priority?: boolean;
}) {
  const src = imageUrl(path, "w500");
  return src ? (
    <Image
      src={src}
      alt={`Poster von ${title}`}
      fill
      sizes="(max-width: 640px) 44vw, (max-width: 1100px) 25vw, 220px"
      priority={priority}
    />
  ) : (
    <div className="poster-fallback">
      <Film size={38} />
      <span>Kein Poster</span>
    </div>
  );
}
