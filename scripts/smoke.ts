/**
 * Smoke test for the view-only server (post-pivot).
 * Hiring flows run in the OpenClaw plugin → Mem0; this server only serves /health and /view.
 */
import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const schema = z.object({
  TALENTOS_BASE_URL: z.url().default("http://127.0.0.1:3010"),
  TALENTOS_API_KEY: z.string().optional()
});

const env = schema.parse(process.env);
const baseUrl = env.TALENTOS_BASE_URL.replace(/\/+$/, "");

async function main(): Promise<void> {
  console.log("1) GET / ...");
  const root = await get("/");
  if (!root.ok) throw new Error(`GET / failed: ${JSON.stringify(root)}`);
  console.log("   ", root.message ?? "ok");

  console.log("2) GET /health ...");
  const health = await get("/health");
  if (!health.ok) throw new Error(`GET /health failed: ${JSON.stringify(health)}`);
  console.log("   ", health.service, health.env);

  console.log("3) GET /api/v1/talent/view ...");
  const view = await get("/api/v1/talent/view?roleTitle=Staff+Engineer&topK=10");
  if (!view.ok) throw new Error(`GET /view failed: ${JSON.stringify(view)}`);
  const d = view.data;
  if (!d) throw new Error("Missing data in view response");
  const total = d.pipeline?.summary?.totalCandidates ?? 0;
  const memCount = Array.isArray(d.memories) ? d.memories.length : 0;
  console.log(`   Pipeline candidates: ${total}, memories: ${memCount}`);

  console.log("Smoke test passed (view-only server).");
}

type ApiEnvelope = {
  ok: boolean;
  data?: unknown;
  message?: string;
  service?: string;
  env?: string;
  error?: string;
};

async function get(path: string): Promise<ApiEnvelope> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (env.TALENTOS_API_KEY) {
    headers.Authorization = `Bearer ${env.TALENTOS_API_KEY}`;
  }

  const response = await fetch(`${baseUrl}${path}`, { method: "GET", headers });
  const text = await response.text();
  const payload = parseJson<ApiEnvelope>(text);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) ${path}: ${text}`);
  }
  return payload;
}

function parseJson<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    throw new Error(`Invalid JSON response: ${raw}`, { cause: error });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
