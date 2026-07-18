"use client";

import Image from "next/image";
import { Film } from "lucide-react";
import { imageUrl } from "@/lib/tmdb-image";
import { useI18n } from "@/components/app-provider";

export function MediaPoster({
  path,
  title,
  priority = false,
}: {
  path: string | null;
  title: string;
  priority?: boolean;
}) {
  const { t } = useI18n();
  const src = imageUrl(path, "w500");
  return src ? (
    <Image
      src={src}
      alt={t("common.posterAlt", { title })}
      fill
      sizes="(max-width: 640px) 44vw, (max-width: 1100px) 25vw, 220px"
      priority={priority}
    />
  ) : (
    <div className="poster-fallback">
      <Film size={38} />
      <span>{t("common.noPoster")}</span>
    </div>
  );
}
