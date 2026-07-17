import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SimilarClient } from "@/components/similar-client";
import type { MediaType } from "@/lib/types";

export const metadata: Metadata = { title: "Ähnliche Titel" };

export default async function SimilarPage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  const numericId = Number(id);
  if ((type !== "movie" && type !== "tv") || !Number.isInteger(numericId) || numericId <= 0) notFound();
  return <SimilarClient type={type as MediaType} id={numericId} />;
}
