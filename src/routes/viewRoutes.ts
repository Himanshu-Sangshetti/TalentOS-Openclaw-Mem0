import type { Request, Response } from "express";
import { Router } from "express";
import type { Mem0Client } from "../mem0/client.js";

const MEMORY_VERSION = "v2" as const;

function extractCandidateName(text: string): string | undefined {
  const profile = /Candidate profile recorded for ([^.]+)\./i.exec(text);
  if (profile?.[1]) return profile[1].trim();
  if (text.startsWith("Interaction logged for ")) {
    const name = text.slice(22).split(" on ")[0];
    if (name) return name.trim();
  }
  if (text.startsWith("Commitment tracked for ")) {
    const name = text.slice(22).split(".")[0];
    if (name) return name.trim();
  }
  return undefined;
}

function dedupeCandidateMemories(
  memories: Array<{ id: string; memory: string; created_at?: string; metadata?: Record<string, unknown> | null }>
) {
  const byCandidate = new Map<string, (typeof memories)[0]>();
  for (const m of memories) {
    const meta = m.metadata ?? {};
    const candidateId =
      (typeof meta.candidate_id === "string" && meta.candidate_id.trim()) ||
      extractCandidateName(m.memory) ||
      m.id;
    const key = candidateId || m.id;
    const existing = byCandidate.get(key);
    const mTime = new Date(m.created_at ?? 0).getTime();
    const exTime = existing ? new Date(existing.created_at ?? 0).getTime() : 0;
    if (!existing || mTime > exTime) byCandidate.set(key, m);
  }
  return [...byCandidate.values()];
}

/**
 * View-only routes: dashboard data from Mem0. No hiring POST endpoints.
 * Used after pivot when all hiring runs in the OpenClaw plugin → Mem0.
 */
export function createViewRoutes(mem0: Mem0Client, userId: string): Router {
  const router = Router();

  router.get("/view", async (req: Request, res: Response) => {
    try {
      const roleTitle = (req.query.roleTitle as string)?.trim() || "Staff Engineer";
      const q = (req.query.q as string)?.trim() || "";
      const topK = Math.min(Number(req.query.topK) || 20, 50);

      const [pipelineResult, previewResult] = await Promise.all([
        mem0.searchMemories({
          query: `candidates and their current stage for role ${roleTitle}, pipeline status`,
          filters: { user_id: userId },
          top_k: 30,
          rerank: true,
          threshold: 0.2,
          version: MEMORY_VERSION
        }),
        mem0.searchMemories({
          query: q || "hiring candidates interactions promises pipeline",
          filters: { user_id: userId },
          top_k: topK,
          rerank: true,
          threshold: 0,
          version: MEMORY_VERSION
        })
      ]);

      const pipelineMemories = pipelineResult.memories ?? [];
      const deduped = dedupeCandidateMemories(pipelineMemories);

      res.json({
        ok: true,
        data: {
          pipeline: {
            roleTitle,
            summary: { totalCandidates: deduped.length, memories: pipelineMemories.length },
            candidates: deduped.slice(0, 15).map((m) => ({
              memory: m.memory,
              created_at: m.created_at
            }))
          },
          memories: (previewResult.memories ?? []).map((m) => ({
            id: m.id,
            memory: m.memory,
            score: m.score,
            created_at: m.created_at
          }))
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(502).json({ ok: false, error: "Mem0Error", message });
    }
  });

  return router;
}
