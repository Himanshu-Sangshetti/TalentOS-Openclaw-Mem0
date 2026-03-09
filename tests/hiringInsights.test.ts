import { describe, expect, it } from "vitest";
import {
  buildAtRiskCandidates,
  buildDueFollowups,
  extractCandidateNameFromMemory,
  extractDueDateFromMemory
} from "../src/domain/hiringInsights.js";
import type { Mem0SearchMemory } from "../src/mem0/types.js";

describe("hiringInsights", () => {
  it("extracts candidate names from different memory formats", () => {
    expect(extractCandidateNameFromMemory("Candidate profile recorded for Priya Sharma. Role focus: Staff Engineer.")).toBe(
      "Priya Sharma"
    );
    expect(extractCandidateNameFromMemory("Interaction logged for Rohan Gupta on 2026-03-09T00:00:00Z. Role: X.")).toBe(
      "Rohan Gupta"
    );
    expect(extractCandidateNameFromMemory("Commitment tracked for Alex Chen. Role: X. Commitment: Y.")).toBe("Alex Chen");
  });

  it("extracts due date", () => {
    expect(extractDueDateFromMemory("Commitment tracked for A. Due date: 2026-03-12. Owner: founder.")).toBe("2026-03-12");
  });

  it("builds due followups from memories", () => {
    const mems: Mem0SearchMemory[] = [
      {
        id: "1",
        memory: "Commitment tracked for Priya Sharma. Due date: 2026-03-12. Owner: founder. Commitment: Send schedule.",
        created_at: "2026-03-09T00:00:00Z"
      }
    ];
    const out = buildDueFollowups(mems);
    expect(out).toHaveLength(1);
    expect(out[0].candidateName).toBe("Priya Sharma");
    expect(out[0].dueDate).toBe("2026-03-12");
  });

  it("flags at-risk when last activity is older than staleDays", () => {
    const mems: Mem0SearchMemory[] = [
      {
        id: "1",
        memory: "Interaction logged for Priya Sharma on 2026-03-01T00:00:00Z. Role: Staff Engineer. Stage: technical.",
        created_at: "2026-03-01T00:00:00Z"
      },
      {
        id: "2",
        memory: "Interaction logged for Rohan Gupta on 2026-03-08T00:00:00Z. Role: Staff Engineer. Stage: screening.",
        created_at: "2026-03-08T00:00:00Z"
      }
    ];

    const now = "2026-03-09T00:00:00Z";
    const atRisk = buildAtRiskCandidates(mems, now, 7);
    expect(atRisk.map((r) => r.candidateName)).toContain("Priya Sharma");
    expect(atRisk.map((r) => r.candidateName)).not.toContain("Rohan Gupta");
  });
});

