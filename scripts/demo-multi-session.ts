/**
 * Multi-session persistence demo.
 *
 * Phase 1: Seed hiring data via TalentOS API (writes to Mem0).
 * Phase 2: Query "who are we hiring?" style questions from memory.
 *
 * Between phases you can restart the OpenClaw gateway (or even the TalentOS
 * server) to prove that memory persists across sessions — Mem0 holds the state.
 *
 * Usage:
 *   1. Start TalentOS: npm run dev
 *   2. Run: npx tsx scripts/demo-multi-session.ts
 *   3. Optional between Phase 1 and 2: kill and restart the gateway; then run
 *      only Phase 2 (or run full script again; Phase 2 will still read from Mem0).
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
  const runPhase2Only = process.argv.includes("--phase2-only");

  if (!runPhase2Only) {
    await phase1SeedData();
    console.log("\n--- Optional: restart OpenClaw gateway here to prove cross-session persistence ---\n");
    console.log("   Waiting 20s for Mem0 indexing...");
    await sleep(20000);
  }

  await phase2RecallFromMemory();
  console.log("\nMulti-session demo complete.");
}

async function phase1SeedData(): Promise<void> {
  console.log("=== Phase 1: Seed hiring data (writes to Mem0) ===\n");

  const dueDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  console.log("1) Adding candidates...");
  await post("/api/v1/talent/candidates", {
    name: "Priya Sharma",
    roleTitle: "Staff Engineer",
    currentCompany: "Razorpay",
    location: "Pune",
    skills: ["Go", "Distributed systems"],
    referrerName: "Ankit",
    sourceChannel: "openclaw"
  });
  await post("/api/v1/talent/candidates", {
    name: "Rohan Gupta",
    roleTitle: "Founding AI Engineer",
    currentCompany: "Stripe",
    location: "Bangalore",
    skills: ["python", "agents", "infra"],
    referrerName: "Priya",
    sourceChannel: "openclaw"
  });
  await post("/api/v1/talent/candidates", {
    name: "Alex Chen",
    roleTitle: "Staff Engineer",
    currentCompany: "Meta",
    location: "SF",
    skills: ["backend", "scaling"],
    referrerName: "Ankit",
    sourceChannel: "openclaw"
  });

  console.log("2) Logging interactions...");
  await post("/api/v1/talent/interactions", {
    candidateName: "Priya Sharma",
    roleTitle: "Staff Engineer",
    stage: "technical",
    summary: "Strong on distributed systems. Some concern about startup stability.",
    strengths: ["system design"],
    concerns: ["startup risk"],
    nextStep: "onsite"
  });
  await post("/api/v1/talent/interactions", {
    candidateName: "Rohan Gupta",
    roleTitle: "Founding AI Engineer",
    stage: "screening",
    summary: "Good fit for AI/agents. Excited about early-stage.",
    strengths: ["memory systems", "APIs"],
    concerns: [],
    nextStep: "technical"
  });

  console.log("3) Tracking a promise...");
  await post("/api/v1/talent/promises", {
    candidateName: "Priya Sharma",
    roleTitle: "Staff Engineer",
    commitment: "Send onsite schedule by Friday.",
    dueDate,
    owner: "hiring-team"
  });

  console.log("   Phase 1 done. Data is in Mem0.");
}

async function phase2RecallFromMemory(): Promise<void> {
  console.log("=== Phase 2: Recall from memory (who are we hiring?) ===\n");

  console.log("1) Shortlist for Staff Engineer...");
  const shortlist = await post("/api/v1/talent/query/shortlist", {
    roleTitle: "Staff Engineer",
    topK: 10
  });
  assertOk(shortlist);
  const list = (shortlist.data as { memory?: string }[]) ?? [];
  console.log(`   Found ${list.length} candidate memories.`);
  list.slice(0, 3).forEach((m) => console.log(`   - ${(m as { memory?: string }).memory?.slice(0, 80)}...`));

  console.log("\n2) Pipeline health for Staff Engineer...");
  const health = await post("/api/v1/talent/query/pipeline-health", {
    roleTitle: "Staff Engineer"
  });
  assertOk(health);
  const healthData = health.data as { summary?: { totalCandidates: number }; memories?: unknown[] };
  console.log(`   Total candidates in pipeline: ${healthData?.summary?.totalCandidates ?? "—"}`);

  console.log("\n3) Who was referred by Ankit?");
  const referrers = await post("/api/v1/talent/query/referrer-network", {
    referrerName: "Ankit",
    topK: 10
  });
  assertOk(referrers);
  const refList = (referrers.data as { memory?: string }[]) ?? [];
  console.log(`   Found ${refList.length} memories.`);
  refList.slice(0, 3).forEach((m) => console.log(`   - ${(m as { memory?: string }).memory?.slice(0, 80)}...`));

  console.log("\n4) Candidates who expressed concerns about startup risk?");
  const concerns = await post("/api/v1/talent/query/concern-patterns", {
    concernTopic: "startup risk",
    topK: 10
  });
  assertOk(concerns);
  const concernList = (concerns.data as { memory?: string }[]) ?? [];
  console.log(`   Found ${concernList.length} memories.`);
  concernList.slice(0, 2).forEach((m) => console.log(`   - ${(m as { memory?: string }).memory?.slice(0, 80)}...`));
}

type ApiEnvelope = {
  ok: boolean;
  data?: unknown;
  error?: string;
  message?: string;
};

async function post(path: string, body: Record<string, unknown>): Promise<ApiEnvelope> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (env.TALENTOS_API_KEY) {
    headers.Authorization = `Bearer ${env.TALENTOS_API_KEY}`;
  }
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
  const text = await response.text();
  const payload = JSON.parse(text) as ApiEnvelope;
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) ${path}: ${text}`);
  }
  return payload;
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
