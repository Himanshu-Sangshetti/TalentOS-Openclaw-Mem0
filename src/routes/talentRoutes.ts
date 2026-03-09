import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { ZodError } from "zod";
import { Mem0HttpError } from "../mem0/client.js";
import {
  CandidateInputSchema,
  CandidateTimelineQuerySchema,
  ConcernPatternsQuerySchema,
  FollowupQuerySchema,
  InteractionInputSchema,
  PipelineHealthQuerySchema,
  PromiseInputSchema,
  ReferrerNetworkQuerySchema,
  ShortlistQuerySchema
} from "../domain/schemas.js";
import type { TalentMemoryService } from "../services/talentMemoryService.js";

export function createTalentRoutes(service: TalentMemoryService): Router {
  const router = Router();

  router.post("/candidates", async (req, res, next) => {
    try {
      const payload = CandidateInputSchema.parse(req.body);
      const result = await service.upsertCandidate(payload);
      res.status(201).json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  });

  router.post("/interactions", async (req, res, next) => {
    try {
      const payload = InteractionInputSchema.parse(req.body);
      const result = await service.logInteraction(payload);
      res.status(201).json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  });

  router.post("/promises", async (req, res, next) => {
    try {
      const payload = PromiseInputSchema.parse(req.body);
      const result = await service.trackPromise(payload);
      res.status(201).json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  });

  router.post("/query/shortlist", async (req, res, next) => {
    try {
      const payload = ShortlistQuerySchema.parse(req.body);
      const result = await service.shortlistCandidates(payload);
      res.json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  });

  router.post("/query/timeline", async (req, res, next) => {
    try {
      const payload = CandidateTimelineQuerySchema.parse(req.body);
      const result = await service.getCandidateTimeline(payload);
      res.json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  });

  router.post("/query/followups", async (req, res, next) => {
    try {
      const payload = FollowupQuerySchema.parse(req.body);
      const result = await service.getFollowups(payload);
      res.json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  });

  router.post("/query/referrer-network", async (req, res, next) => {
    try {
      const payload = ReferrerNetworkQuerySchema.parse(req.body);
      const result = await service.getReferrerNetwork(payload);
      res.json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  });

  router.post("/query/pipeline-health", async (req, res, next) => {
    try {
      const payload = PipelineHealthQuerySchema.parse(req.body);
      const result = await service.getPipelineHealth(payload);
      res.json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  });

  router.post("/query/concern-patterns", async (req, res, next) => {
    try {
      const payload = ConcernPatternsQuerySchema.parse(req.body);
      const result = await service.getConcernPatterns(payload);
      res.json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  });

  // -------------------------------------------------------------------------
  // Memory visibility (view / dashboard) — GET so browsers can open or fetch
  // -------------------------------------------------------------------------
  router.get("/view", async (req, res, next) => {
    try {
      const roleTitle = (req.query.roleTitle as string)?.trim() || "Staff Engineer";
      const q = (req.query.q as string)?.trim() || "";
      const topK = Math.min(Number(req.query.topK) || 20, 50);

      const [pipeline, memories] = await Promise.all([
        service.getPipelineHealth({ roleTitle, topK: 30 }),
        service.getMemoryPreview(q, topK)
      ]);

      res.json({
        ok: true,
        data: {
          pipeline: {
            roleTitle,
            summary: pipeline.summary,
            candidates: pipeline.memories.slice(0, 15).map((m) => ({
              memory: m.memory,
              created_at: m.created_at
            }))
          },
          memories: memories.map((m) => ({
            id: m.id,
            memory: m.memory,
            score: m.score,
            created_at: m.created_at
          }))
        }
      });
    } catch (error) {
      next(error);
    }
  });

  router.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
    void next;
    if (error instanceof ZodError) {
      res.status(400).json({ ok: false, error: "ValidationError", details: error.issues });
      return;
    }

    if (error instanceof Mem0HttpError) {
      res.status(502).json({
        ok: false,
        error: "Mem0Error",
        message: error.message,
        details: error.responseBody
      });
      return;
    }

    const message = error instanceof Error ? error.message : "Unknown server error";
    res.status(500).json({ ok: false, error: "InternalServerError", message });
  });

  return router;
}
