import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { BACKEND_ROOT, KB_DIR } from "../kb/loadKb.js";
import type { EntitiesFile } from "./linker.js";
import type { RouterConfig } from "./model.js";

// The encoder and its router settings come from the Hugging Face repo, pinned
// to a commit so a new upload can never silently change the assistant's
// answers. Bump CHAT_MODEL_REVISION deliberately after re-running the eval.
export const CHAT_MODEL_ID = process.env.CHAT_MODEL_ID || "adiikj/tradexcel-assistant-encoder";
export const CHAT_MODEL_REVISION = process.env.CHAT_MODEL_REVISION || "bc4669e1e2db1f32c732b7b62d577031c1bb1b2a";
export const CHAT_CACHE_DIR = process.env.CHAT_CACHE_DIR || join(BACKEND_ROOT, ".cache/chat");

// On by default; CHAT_ENABLED=false skips loading the model (e.g. on a tiny box).
export function chatEnabled(): boolean {
  return process.env.CHAT_ENABLED !== "false";
}

export function loadEntities(): EntitiesFile {
  return parse(readFileSync(join(KB_DIR, "entities/stocks.yaml"), "utf8")) as EntitiesFile;
}

// Downloaded once per revision, then read from disk.
export async function loadRouterConfig(): Promise<RouterConfig> {
  const file = join(CHAT_CACHE_DIR, `tradexcel_router-${CHAT_MODEL_REVISION.slice(0, 12)}.json`);
  if (!existsSync(file)) {
    const url = `https://huggingface.co/${CHAT_MODEL_ID}/resolve/${CHAT_MODEL_REVISION}/tradexcel_router.json`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Couldn't download ${url}: ${response.status}`);
    mkdirSync(CHAT_CACHE_DIR, { recursive: true });
    writeFileSync(file, await response.text());
  }
  return JSON.parse(readFileSync(file, "utf8")) as RouterConfig;
}
