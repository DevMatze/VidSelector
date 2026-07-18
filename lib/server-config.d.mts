import type { AppConfig } from "./config.mjs";

export function nextServerArguments(
  config: AppConfig,
  command: "dev" | "start",
  additionalArguments?: string[],
): string[];
