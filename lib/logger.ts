import { appendFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { appConfig, type LogLevel } from "@/lib/config.mjs";

type Details = Record<string, string | number | boolean | null | undefined>;
type LoggingConfig = typeof appConfig.logging;

const priorities: Record<LogLevel, number> = { error: 0, warn: 1, info: 2, debug: 3 };

function serialize(level: LogLevel, message: string, details?: Details) {
  const suffix = details ? ` ${JSON.stringify(details)}` : "";
  return `${new Date().toISOString()} ${level.toUpperCase()} ${message}${suffix}`;
}

export function createLogger(config: LoggingConfig = appConfig.logging) {
  function write(level: LogLevel, message: string, details?: Details, force = false) {
    if (!force && priorities[level] > priorities[config.level]) return;
    const line = serialize(level, message, details);
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
    if (config.file.trim()) {
      const target = path.resolve(process.cwd(), config.file);
      mkdirSync(path.dirname(target), { recursive: true });
      appendFileSync(target, `${line}\n`, { encoding: "utf8", mode: 0o600 });
    }
  }

  return {
    error: (message: string, details?: Details) => write("error", message, details),
    warn: (message: string, details?: Details) => write("warn", message, details),
    info: (message: string, details?: Details) => write("info", message, details),
    debug: (message: string, details?: Details) => write("debug", message, details),
    request: (method: string, pathname: string) => {
      if (config.log_requests) write("info", "HTTP-Anfrage", { method, pathname }, true);
    },
  };
}

export const logger = createLogger();
