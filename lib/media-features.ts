import { appConfig } from "@/lib/config.mjs";
import type { MediaDetails } from "@/lib/types";

type MediaFeatures = typeof appConfig.features;

export function configuredMediaFeatureFingerprint(features: MediaFeatures) {
  return [
    features.streaming_providers ? "providers" : "no-providers",
    features.trailers ? "trailers" : "no-trailers",
    features.similar_titles ? "similar" : "no-similar",
  ].join(":");
}

export function mediaDetailRequestPlan(features: MediaFeatures) {
  return {
    appendedResponses: [
      "credits",
      ...(features.trailers ? ["videos"] : []),
      ...(features.similar_titles ? ["similar", "recommendations"] : []),
    ],
    fetchProviders: features.streaming_providers,
  };
}

export const mediaFeatureFingerprint = configuredMediaFeatureFingerprint(appConfig.features);

export function applyConfiguredMediaFeatures(
  media: MediaDetails,
  features: MediaFeatures = appConfig.features,
): MediaDetails {
  return {
    ...media,
    trailerKey: features.trailers ? media.trailerKey : undefined,
    providers: features.streaming_providers ? media.providers : [],
    watchProviderUrl: features.streaming_providers ? media.watchProviderUrl : undefined,
    similar: features.similar_titles ? media.similar : [],
    featureFingerprint: configuredMediaFeatureFingerprint(features),
  };
}
