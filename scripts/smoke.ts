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
  const now = new Date();
  const dueDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const roleTitle = "Founding AI Engineer";
  const candidateName = "Rohan Gupta";

  console.log("1) Creating candidate...");
  await post("/api/v1/talent/candidates", {
    name: candidateName,
    roleTitle,
    currentCompany: "Stripe",
    location: "Bangalore",
    currentStage: "screening",
    skills: ["python", "agents", "infra"],
    referrerName: "Priya"
  });

  console.log("2) Logging interaction...");
  await post("/api/v1/talent/interactions", {
    candidateName,
    roleTitle,
    stage: "technical",
    summary: "Strong systems design and memory architecture understanding.",
    strengths: ["systems", "api design"],
    concerns: ["startup risk"],
    nextStep: "onsite"
  });

  console.log("3) Tracking promise...");
  await post("/api/v1/talent/promises", {
    candidateName,
    roleTitle,
    commitment: "Share onsite panel details.",
    dueDate,
    owner: "founder"
  });

  console.log("   Waiting 20s for Mem0 Cloud indexing...");
  await sleep(20000);

  console.log("4) Fetching timeline...");
  const timeline = await post("/api/v1/talent/query/timeline", {
    candidateName,
    roleTitle
  });
  assertOk(timeline);
  console.log(`Timeline memories: ${timeline.data.length}`);

  console.log("5) Fetching shortlist...");
  const shortlist = await post("/api/v1/talent/query/shortlist", {
    roleTitle,
    stageIn: ["screening", "technical", "onsite"],
    requiredSkills: ["python", "infra"]
  });
  assertOk(shortlist);
  console.log(`Shortlist memories: ${shortlist.data.length}`);

  console.log("6) Fetching followups...");
  const followups = await post("/api/v1/talent/query/followups", {
    fromDate: now.toISOString().slice(0, 10),
    toDate: dueDate
  });
  assertOk(followups);
  console.log(`Followups due: ${followups.data.length}`);

  console.log("Smoke test passed.");
}

type ApiEnvelope = {
  ok: boolean;
  data?: unknown;
  error?: string;
  message?: string;
};

async function post(path: string, body: Record<string, unknown>): Promise<ApiEnvelope> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  if (env.TALENTOS_API_KEY) {
    headers.Authorization = `Bearer ${env.TALENTOS_API_KEY}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
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

function assertOk(payload: ApiEnvelope): void {
  if (!payload.ok) {
    throw new Error(payload.message ?? payload.error ?? "Unknown API error");
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
