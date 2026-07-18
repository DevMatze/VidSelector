#!/usr/bin/env node

import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { appConfig } from "../lib/config.mjs";
import { nextServerArguments } from "../lib/server-config.mjs";

const [command, ...additionalArguments] = process.argv.slice(2);
if (command !== "dev" && command !== "start") {
  console.error("Verwendung: node scripts/run-server.mjs <dev|start> [weitere Next.js-Argumente]");
  process.exit(1);
}

const nextCli = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, [nextCli, ...nextServerArguments(appConfig, command, additionalArguments)], {
  stdio: "inherit",
  env: process.env,
});

child.on("error", (error) => {
  console.error(`VidSelector konnte nicht gestartet werden: ${error.message}`);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exitCode = code ?? 1;
});
