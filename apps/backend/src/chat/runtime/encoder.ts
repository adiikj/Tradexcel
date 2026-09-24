import { env, pipeline } from "@huggingface/transformers";
import { CHAT_CACHE_DIR, CHAT_MODEL_ID, CHAT_MODEL_REVISION } from "./config.js";
import type { RouterConfig } from "./model.js";

export interface Encoder {
  // L2-normalised sentence embeddings, one per text.
  embed(texts: string[]): Promise<Float32Array[]>;
}

// transformers.js runs the ONNX export on onnxruntime-node (CPU). Pooling and
// dtype come from the router config written by the export script, so they
// always match what the model was evaluated with.
export async function loadEncoder(cfg: RouterConfig): Promise<Encoder> {
  env.cacheDir = CHAT_CACHE_DIR;
  const extractor = await pipeline("feature-extraction", CHAT_MODEL_ID, {
    revision: CHAT_MODEL_REVISION,
    dtype: cfg.encoder.dtype,
    // Sized for a 1 GB / 2 vCPU VM shared with the API: one inference thread,
    // and no pre-allocated memory arena (short inputs don't need it).
    session_options: { intraOpNumThreads: 1, interOpNumThreads: 1, enableCpuMemArena: false, enableMemPattern: false },
  });
  return {
    async embed(texts) {
      if (texts.length === 0) return [];
      const out = await extractor(texts, { pooling: cfg.encoder.pooling, normalize: cfg.encoder.normalize });
      const dim = out.dims[1];
      const data = out.data as Float32Array;
      return texts.map((_, i) => data.slice(i * dim, (i + 1) * dim));
    },
  };
}
