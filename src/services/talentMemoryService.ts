import type { RuntimeConfig } from "../config/env.js";
import {
  type CandidateInput,
  type CandidateTimelineQuery,
  type FollowupQuery,
  type InteractionInput,
  type PromiseInput,
  type ShortlistQuery
} from "../domain/schemas.js";
import { isInDateRange, slugify, toIsoDate } from "../domain/utils.js";
import { Mem0Client } from "../mem0/client.js";
import type { Mem0SearchMemory } from "../mem0/types.js";

const MEMORY_VERSION = "v2" as const;

export class TalentMemoryService {
  private readonly mem0: Mem0Client;
  private readonly config: RuntimeConfig;

  constructor(config: RuntimeConfig) {
    this.config = config;
    this.mem0 = new Mem0Client({
      apiKey: config.MEM0_API_KEY,
      baseUrl: config.MEM0_BASE_URL
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

    const events = await this.mem0.addMemories({
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

    const events = await this.mem0.addMemories({
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

    return { candidateId, events: events.length };
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

    const events = await this.mem0.addMemories({
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
    const filters: Record<string, unknown> = {
      AND: [
        { user_id: this.config.TALENTOS_USER_ID },
        { entity_type: "candidate" },
        { role_title: payload.roleTitle }
      ]
    };

    if (payload.requiredSkills.length > 0) {
      filters.AND = [
        ...(filters.AND as unknown[]),
        {
          OR: payload.requiredSkills.map((skill) => ({
            skills: { icontains: skill }
          }))
        }
      ];
    }

    const { memories } = await this.mem0.searchMemories({
      query: payload.query,
      filters,
      top_k: payload.topK,
      rerank: true,
      threshold: 0.2,
      version: MEMORY_VERSION
    });

    return memories;
  }

  async getCandidateTimeline(payload: CandidateTimelineQuery): Promise<Mem0SearchMemory[]> {
    const filters: Record<string, unknown> = {
      AND: [
        { user_id: this.config.TALENTOS_USER_ID },
        { candidate_name: payload.candidateName }
      ]
    };

    if (payload.roleTitle) {
      (filters.AND as Record<string, string>[]).push({ role_title: payload.roleTitle });
    }

    const { memories } = await this.mem0.searchMemories({
      query: `timeline for ${payload.candidateName}`,
      filters,
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
    const { memories } = await this.mem0.searchMemories({
      query: "open followups and commitments",
      filters: {
        AND: [
          { user_id: this.config.TALENTOS_USER_ID },
          { entity_type: "promise" },
          { promise_status: "open" }
        ]
      },
      top_k: payload.topK,
      rerank: true,
      threshold: 0.0,
      version: MEMORY_VERSION
    });

    const fromDate = payload.fromDate;
    const toDate = payload.toDate;
    return memories.filter((memory) => {
      const metadata = memory.metadata ?? {};
      const dueDate = typeof metadata.due_date === "string" ? metadata.due_date : undefined;
      return dueDate ? isInDateRange(dueDate, fromDate, toDate) : false;
    });
  }
}
