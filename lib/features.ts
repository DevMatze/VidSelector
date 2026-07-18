import { appConfig } from "@/lib/config.mjs";

export type FeatureName = keyof typeof appConfig.features;

export class FeatureDisabledError extends Error {
  constructor(public readonly feature: FeatureName) {
    super(`Die Funktion „${feature}“ ist in config.yml deaktiviert.`);
    this.name = "FeatureDisabledError";
  }
}

export function assertFeatureEnabled(feature: FeatureName, features = appConfig.features) {
  if (!features[feature]) throw new FeatureDisabledError(feature);
}
