import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryClient } from "@/components/category-client";
import { isRecommendationCategorySlug, RECOMMENDATION_CATEGORIES } from "@/lib/recommendation-categories";
import { getProfileLanguage } from "@/lib/data";
import { translate } from "@/lib/i18n";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return Object.keys(RECOMMENDATION_CATEGORIES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!isRecommendationCategorySlug(slug)) return {};
  const language = await getProfileLanguage();
  return { title: translate(language, `category.${slug}.title`) };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  if (!isRecommendationCategorySlug(slug)) notFound();
  return <CategoryClient slug={slug} />;
}
