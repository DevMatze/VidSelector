import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createLogger } from "@/lib/logger";

const directories: string[] = [];

afterEach(() => {
  directories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true }));
  vi.restoreAllMocks();
});

describe("Logger", () => {
  it("beachtet das konfigurierte Log-Level", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const logger = createLogger({ level: "info", log_requests: false, file: "" });

    logger.debug("unsichtbar");
    logger.info("sichtbar");

    expect(log).toHaveBeenCalledOnce();
    expect(log.mock.calls[0][0]).toContain("sichtbar");
  });

  it("schreibt Protokolle in die konfigurierte Datei", () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const directory = mkdtempSync(path.join(tmpdir(), "vidselector-log-"));
    directories.push(directory);
    const file = path.join(directory, "app.log");
    const logger = createLogger({ level: "debug", log_requests: false, file });

    logger.debug("Dateitest", { count: 2 });

    expect(readFileSync(file, "utf8")).toContain('DEBUG Dateitest {"count":2}');
  });

  it("protokolliert HTTP-Anfragen nur bei aktiviertem Schalter", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    createLogger({ level: "error", log_requests: false, file: "" }).request("GET", "/ohne");
    createLogger({ level: "error", log_requests: true, file: "" }).request("GET", "/mit");

    expect(log).toHaveBeenCalledOnce();
    expect(log.mock.calls[0][0]).toContain('"pathname":"/mit"');
  });
});
