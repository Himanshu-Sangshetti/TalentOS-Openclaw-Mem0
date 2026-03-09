import type { Mem0SearchMemory } from "../mem0/types.js";

export type DueFollowup = {
  candidateName?: string;
  dueDate?: string;
  owner?: string;
  commitment?: string;
  memory: string;
  created_at?: string;
};

export type AtRiskCandidate = {
  candidateName?: string;
  reason: string;
  lastActivityAt?: string;
  memory: string;
  created_at?: string;
};

const interactionPrefix = "Interaction logged for ";
const commitmentPrefix = "Commitment tracked for ";

export function extractCandidateNameFromMemory(text: string): string | undefined {
  // Candidate profile recorded for X.
  const profile = /Candidate profile recorded for ([^.]+)\./i.exec(text);
  if (profile?.[1]) return profile[1].trim();

  // Interaction logged for X on ...
  if (text.startsWith(interactionPrefix)) {
    const rest = text.slice(interactionPrefix.length);
    const name = rest.split(" on ")[0];
    if (name) return name.trim();
  }

  // Commitment tracked for X.
  if (text.startsWith(commitmentPrefix)) {
    const rest = text.slice(commitmentPrefix.length);
    const name = rest.split(".")[0];
    if (name) return name.trim();
  }

  return undefined;
}

export function extractDueDateFromMemory(text: string): string | undefined {
  // Due date: YYYY-MM-DD.
  const m = /Due date:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/i.exec(text);
  return m?.[1];
}

export function extractOwnerFromMemory(text: string): string | undefined {
  const m = /Owner:\s*([^.]+)\./i.exec(text);
  return m?.[1]?.trim();
}

export function extractCommitmentFromMemory(text: string): string | undefined {
  const m = /Commitment:\s*([^.]*)\./i.exec(text);
  return m?.[1]?.trim();
}

export function isoDaysBetween(fromIso: string, toIso: string): number | undefined {
  const a = new Date(fromIso).getTime();
  const b = new Date(toIso).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return undefined;
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((b - a) / msPerDay);
}

export function buildDueFollowups(memories: Mem0SearchMemory[]): DueFollowup[] {
  return memories.map((m) => ({
    candidateName: extractCandidateNameFromMemory(m.memory),
    dueDate: extractDueDateFromMemory(m.memory),
    owner: extractOwnerFromMemory(m.memory),
    commitment: extractCommitmentFromMemory(m.memory),
    memory: m.memory,
    created_at: m.created_at
  }));
}

export function buildAtRiskCandidates(
  memories: Mem0SearchMemory[],
  nowIso: string,
  staleDays: number
): AtRiskCandidate[] {
  const byCandidate = new Map<string, Mem0SearchMemory>();

  for (const mem of memories) {
    const name = extractCandidateNameFromMemory(mem.memory) ?? mem.id;
    const existing = byCandidate.get(name);
    if (!existing) {
      byCandidate.set(name, mem);
      continue;
    }

    const a = new Date(existing.created_at ?? 0).getTime();
    const b = new Date(mem.created_at ?? 0).getTime();
    if (b > a) byCandidate.set(name, mem);
  }

  const results: AtRiskCandidate[] = [];
  for (const [name, mem] of byCandidate.entries()) {
    const last = mem.created_at;
    if (!last) continue;
    const days = isoDaysBetween(last, nowIso);
    if (days === undefined || days < staleDays) continue;

    results.push({
      candidateName: name === mem.id ? undefined : name,
      reason: `No recent activity for ${days} days`,
      lastActivityAt: last,
      memory: mem.memory,
      created_at: mem.created_at
    });
  }

  // Most stale first
  return results.sort((a, b) => {
    const ad = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
    const bd = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
    return ad - bd;
  });
}

