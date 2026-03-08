import type { RuntimeConfig } from "../config/env.js";
import {
  type CandidateInput,
  type CandidateTimelineQuery,
  type FollowupQuery,
  type InteractionInput,
  type PromiseInput,
  type ShortlistQuery
} from "../domain/schemas.js";
import { slugify, toIsoDate } from "../domain/utils.js";
import { Mem0Client, Mem0HttpError } from "../mem0/client.js";
import type { Mem0SearchMemory } from "../mem0/types.js";
import type { Mem0AddRequest } from "../mem0/types.js";

const MEMORY_VERSION = "v2" as const;

export class TalentMemoryService {
  private readonly mem0: Mem0Client;
  private readonly config: RuntimeConfig;

  constructor(config: RuntimeConfig) {
    this.config = config;
    this.mem0 = new Mem0Client({
      apiKey: config.MEM0_API_KEY,
      baseUrl: config.MEM0_BASE_URL,
      timeoutMs: config.MEM0_TIMEOUT_MS,
      maxRetries: config.MEM0_MAX_RETRIES,
      retryDelayMs: config.MEM0_RETRY_DELAY_MS
    });
  }

  async upsertCandidate(payload: CandidateInput): Promise<{ candidateId: string; events: number }> {
    const candidateId = payload.candidateId ?? slugify(payload.name);

    const memoryLines = [
      `Candidate profile recorded for ${payload.name}.`,
      `Role focus: ${payload.roleTitle}.`,
      payload.currentCompany ? `Current company: ${payload.currentCompany}.` : undefined,
      payload.location ? `Location: ${payload.location}.` : undefined,
      payload.seniority ? `Seniority: ${payload.seniority}.` : undefined,
      payload.referrerName ? `Referrer: ${payload.referrerName}.` : undefined,
      payload.skills.length > 0 ? `Skills: ${payload.skills.join(", ")}.` : undefined,
      payload.notes ? `Notes: ${payload.notes}.` : undefined
    ]
      .filter(Boolean)
      .join(" ");

    const events = await this.addMemoriesWithGraphFallback({
      user_id: this.config.TALENTOS_USER_ID,
      agent_id: this.config.TALENTOS_AGENT_ID,
      app_id: this.config.TALENTOS_APP_ID,
      messages: [{ role: "user", content: memoryLines }],
      metadata: {
        entity_type: "candidate",
        candidate_id: candidateId,
        candidate_name: payload.name,
        candidate_email: payload.email ?? null,
        candidate_phone: payload.phone ?? null,
        role_title: payload.roleTitle,
        current_stage: payload.currentStage ?? null,
        referrer_name: payload.referrerName ?? null,
        source_channel: payload.sourceChannel,
        skills: payload.skills,
        saved_on: toIsoDate(new Date())
      },
      infer: true,
      async_mode: false,
      version: MEMORY_VERSION,
      enable_graph: this.config.MEM0_ENABLE_GRAPH
    });

    return { candidateId, events: events.length };
  }

  async logInteraction(payload: InteractionInput): Promise<{ candidateId: string; events: number }> {
    const candidateId = payload.candidateId ?? slugify(payload.candidateName);
    const interactionAt = payload.interactionAt ?? new Date().toISOString();

    const memory = [
      `Interaction logged for ${payload.candidateName} on ${interactionAt}.`,
      `Role: ${payload.roleTitle}.`,
      `Stage: ${payload.stage}.`,
      `Summary: ${payload.summary}.`,
      payload.strengths.length > 0 ? `Strengths: ${payload.strengths.join(", ")}.` : undefined,
      payload.concerns.length > 0 ? `Concerns: ${payload.concerns.join(", ")}.` : undefined,
      payload.nextStep ? `Next step: ${payload.nextStep}.` : undefined
    ]
      .filter(Boolean)
      .join(" ");

    const interactionEvents = await this.addMemoriesWithGraphFallback({
      user_id: this.config.TALENTOS_USER_ID,
      agent_id: this.config.TALENTOS_AGENT_ID,
      app_id: this.config.TALENTOS_APP_ID,
      messages: [{ role: "user", content: memory }],
      metadata: {
        entity_type: "interaction",
        candidate_id: candidateId,
        candidate_name: payload.candidateName,
        role_title: payload.roleTitle,
        stage: payload.stage,
        next_step: payload.nextStep ?? null,
        strengths: payload.strengths,
        concerns: payload.concerns,
        source_channel: payload.sourceChannel,
        interaction_at: interactionAt
      },
      infer: true,
      async_mode: false,
      version: MEMORY_VERSION,
      enable_graph: this.config.MEM0_ENABLE_GRAPH
    });

    const stageSnapshotEvents = await this.addMemoriesWithGraphFallback({
      user_id: this.config.TALENTOS_USER_ID,
      agent_id: this.config.TALENTOS_AGENT_ID,
      app_id: this.config.TALENTOS_APP_ID,
      messages: [
        {
          role: "user",
          content: `Candidate ${payload.candidateName} currently at ${payload.stage} stage for ${payload.roleTitle}.`
        }
      ],
      metadata: {
        entity_type: "candidate",
        candidate_id: candidateId,
        candidate_name: payload.candidateName,
        role_title: payload.roleTitle,
        current_stage: payload.stage,
        source_channel: payload.sourceChannel,
        interaction_at: interactionAt
      },
      infer: true,
      async_mode: false,
      version: MEMORY_VERSION,
      enable_graph: this.config.MEM0_ENABLE_GRAPH
    });

    return { candidateId, events: interactionEvents.length + stageSnapshotEvents.length };
  }

  async trackPromise(payload: PromiseInput): Promise<{ candidateId: string; events: number }> {
    const candidateId = payload.candidateId ?? slugify(payload.candidateName);
    const memory = [
      `Commitment tracked for ${payload.candidateName}.`,
      `Role: ${payload.roleTitle}.`,
      `Commitment: ${payload.commitment}.`,
      `Due date: ${payload.dueDate}.`,
      `Owner: ${payload.owner}.`,
      `Status: ${payload.status}.`
    ].join(" ");

    const events = await this.addMemoriesWithGraphFallback({
      user_id: this.config.TALENTOS_USER_ID,
      agent_id: this.config.TALENTOS_AGENT_ID,
      app_id: this.config.TALENTOS_APP_ID,
      messages: [{ role: "user", content: memory }],
      metadata: {
        entity_type: "promise",
        candidate_id: candidateId,
        candidate_name: payload.candidateName,
        role_title: payload.roleTitle,
        promise_owner: payload.owner,
        promise_status: payload.status,
        due_date: payload.dueDate,
        source_channel: payload.sourceChannel
      },
      infer: true,
      async_mode: false,
      version: MEMORY_VERSION,
      enable_graph: this.config.MEM0_ENABLE_GRAPH
    });

    return { candidateId, events: events.length };
  }

  async shortlistCandidates(payload: ShortlistQuery): Promise<Mem0SearchMemory[]> {
    const queryParts = [`candidates for ${payload.roleTitle}`];
    if (payload.requiredSkills.length > 0) {
      queryParts.push(`skills: ${payload.requiredSkills.join(", ")}`);
    }
    if (payload.stageIn.length > 0) {
      queryParts.push(`at stage: ${payload.stageIn.join(" or ")}`);
    }

    const { memories } = await this.mem0.searchMemories({
      query: queryParts.join(". "),
      filters: { user_id: this.config.TALENTOS_USER_ID },
      top_k: payload.topK,
      rerank: true,
      threshold: 0.2,
      version: MEMORY_VERSION
    });

    return this.dedupeCandidateMemories(memories);
  }

  async getCandidateTimeline(payload: CandidateTimelineQuery): Promise<Mem0SearchMemory[]> {
    const queryParts = [`all interactions and details for ${payload.candidateName}`];
    if (payload.roleTitle) {
      queryParts.push(`role: ${payload.roleTitle}`);
    }

    const { memories } = await this.mem0.searchMemories({
      query: queryParts.join(". "),
      filters: { user_id: this.config.TALENTOS_USER_ID },
      top_k: payload.topK,
      rerank: true,
      threshold: 0.0,
      version: MEMORY_VERSION
    });

    return memories.sort((a, b) => {
      const aTime = new Date(a.created_at ?? 0).getTime();
      const bTime = new Date(b.created_at ?? 0).getTime();
      return bTime - aTime;
    });
  }

  async getFollowups(payload: FollowupQuery): Promise<Mem0SearchMemory[]> {
    const queryParts = ["open commitments, promises, and follow-ups with due dates"];
    if (payload.fromDate) {
      queryParts.push(`after ${payload.fromDate}`);
    }
    if (payload.toDate) {
      queryParts.push(`before ${payload.toDate}`);
    }

    const { memories } = await this.mem0.searchMemories({
      query: queryParts.join(". "),
      filters: { user_id: this.config.TALENTOS_USER_ID },
      top_k: payload.topK,
      rerank: true,
      threshold: 0.0,
      version: MEMORY_VERSION
    });

    return memories;
  }

  private dedupeCandidateMemories(memories: Mem0SearchMemory[]): Mem0SearchMemory[] {
    const byCandidate = new Map<string, Mem0SearchMemory>();
    for (const memory of memories) {
      const metadata = memory.metadata ?? {};
      const candidateId = this.readString(metadata.candidate_id) ?? memory.id;
      const existing = byCandidate.get(candidateId);
      if (!existing) {
        byCandidate.set(candidateId, memory);
        continue;
      }

      const existingTime = new Date(existing.created_at ?? 0).getTime();
      const nextTime = new Date(memory.created_at ?? 0).getTime();
      if (nextTime > existingTime) {
        byCandidate.set(candidateId, memory);
      }
    }
    return [...byCandidate.values()];
  }

  private readString(value: unknown): string | undefined {
    return typeof value === "string" && value.trim().length > 0 ? value : undefined;
  }

  private async addMemoriesWithGraphFallback(payload: Mem0AddRequest) {
    try {
      return await this.mem0.addMemories(payload);
    } catch (error) {
      if (!payload.enable_graph || !this.isGraphPlanRestriction(error)) {
        throw error;
      }

      // Fall back to regular memory write when graph memory is unavailable for current plan.
      const fallbackPayload: Mem0AddRequest = { ...payload, enable_graph: false };
      return this.mem0.addMemories(fallbackPayload);
    }
  }

  private isGraphPlanRestriction(error: unknown): boolean {
    if (!(error instanceof Mem0HttpError)) {
      return false;
    }
    const body = error.responseBody.toLowerCase();
    return body.includes("graph memories feature is not available");
  }
}
