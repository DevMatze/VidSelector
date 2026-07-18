import { describe, expect, it } from "vitest";
import { loadConfig } from "@/lib/config.mjs";
import { nextServerArguments } from "@/lib/server-config.mjs";

describe("Serverkonfiguration", () => {
  it("übergibt Listening-Adresse und Port an Next.js", () => {
    const config = loadConfig("/definitiv/nicht/vorhanden.yml");
    config.server.host = "192.168.0.242";
    config.server.port = 4123;
    expect(nextServerArguments(config, "start")).toEqual(["start", "--hostname", "192.168.0.242", "--port", "4123"]);
  });

  it("lässt explizite Zusatzargumente als letzte Werte zu", () => {
    const config = loadConfig("/definitiv/nicht/vorhanden.yml");
    expect(nextServerArguments(config, "dev", ["--port", "5000"])).toEqual([
      "dev",
      "--hostname",
      "0.0.0.0",
      "--port",
      "3000",
      "--port",
      "5000",
    ]);
  });
});
