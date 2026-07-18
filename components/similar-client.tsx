"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Film } from "lucide-react";
import { DemoBanner } from "@/components/demo-banner";
import { MediaCard } from "@/components/media-card";
import { MediaTypeGroups } from "@/components/media-type-groups";
import type { MediaDetails, MediaType } from "@/lib/types";
import { useI18n } from "@/components/app-provider";

interface Payload {
  media: MediaDetails;
  demoMode: boolean;
}

export function SimilarClient({ type, id }: { type: MediaType; id: number }) {
  const { t } = useI18n();
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/media/${type}/${id}`, { signal: controller.signal })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok) throw new Error(json.error);
        setData(json);
      })
      .catch((reason) => {
        if (reason.name !== "AbortError") setError(reason instanceof Error ? reason.message : t("similar.loadError"));
      });
    return () => controller.abort();
  }, [id, type, t]);

  const detailsHref = `/media/${type}/${id}`;
  if (error)
    return (
      <div className="page-shell">
        <Link className="back-link" href={detailsHref}>
          <ArrowLeft size={17} />
          {t("similar.backDetails")}
        </Link>
        <div className="status-panel">
          <Film size={38} />
          <h2>{t("similar.unavailable")}</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  if (!data)
    return (
      <div className="page-shell">
        <div className="status-panel" aria-live="polite" aria-busy="true">
          <div className="spinner" />
          <p>{t("similar.loading")}</p>
        </div>
      </div>
    );

  const { media } = data;
  return (
    <div className="page-shell similar-page">
      <Link className="back-link" href={detailsHref}>
        <ArrowLeft size={17} />
        {t("similar.backTitle", { title: media.title })}
      </Link>
      <div className="page-header">
        <div>
          <p className="eyebrow">{t("similar.eyebrow")}</p>
          <h1>{t(media.type === "movie" ? "detail.similarMovies" : "detail.similarSeries")}</h1>
          <p className="lead">{t("similar.lead", { title: media.title })}</p>
        </div>
      </div>
      {data.demoMode && <DemoBanner />}
      {media.similar.length === 0 ? (
        <div className="status-panel">
          <Film size={38} />
          <h2>{t("similar.empty")}</h2>
          <p>{t("similar.emptyBody")}</p>
        </div>
      ) : (
        <MediaTypeGroups
          items={media.similar}
          getMedia={(item) => item}
          progressive
          renderItem={(item) => <MediaCard key={`${item.type}:${item.tmdbId}`} media={item} />}
        />
      )}
    </div>
  );
}
