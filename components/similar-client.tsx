"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Film } from "lucide-react";
import { DemoBanner } from "@/components/demo-banner";
import { MediaCard } from "@/components/media-card";
import { MediaTypeGroups } from "@/components/media-type-groups";
import type { MediaDetails, MediaType } from "@/lib/types";

interface Payload {
  media: MediaDetails;
  demoMode: boolean;
}

export function SimilarClient({ type, id }: { type: MediaType; id: number }) {
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
        if (reason.name !== "AbortError")
          setError(reason instanceof Error ? reason.message : "Ähnliche Titel sind nicht verfügbar.");
      });
    return () => controller.abort();
  }, [id, type]);

  const detailsHref = `/media/${type}/${id}`;
  if (error)
    return (
      <div className="page-shell">
        <Link className="back-link" href={detailsHref}>
          <ArrowLeft size={17} />
          Zurück zu den Details
        </Link>
        <div className="status-panel">
          <Film size={38} />
          <h2>Ähnliche Titel nicht verfügbar</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  if (!data)
    return (
      <div className="page-shell">
        <div className="status-panel" aria-live="polite" aria-busy="true">
          <div className="spinner" />
          <p>Ähnliche Titel werden geladen …</p>
        </div>
      </div>
    );

  const { media } = data;
  return (
    <div className="page-shell similar-page">
      <Link className="back-link" href={detailsHref}>
        <ArrowLeft size={17} />
        Zurück zu {media.title}
      </Link>
      <div className="page-header">
        <div>
          <p className="eyebrow">Das könnte dir auch gefallen</p>
          <h1>{media.type === "movie" ? "Ähnliche Filme" : "Ähnliche Serien"}</h1>
          <p className="lead">Alle verfügbaren ähnlichen Titel zu {media.title}.</p>
        </div>
      </div>
      {data.demoMode && <DemoBanner />}
      {media.similar.length === 0 ? (
        <div className="status-panel">
          <Film size={38} />
          <h2>Keine ähnlichen Titel gefunden</h2>
          <p>Für diesen Titel liegen aktuell keine weiteren Vorschläge vor.</p>
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
