import { z } from "zod";

const nonEmpty = z.string().trim().min(1);

export const CandidateInputSchema = z.object({
  candidateId: nonEmpty.optional(),
  name: nonEmpty,
  email: z.email().optional(),
  phone: nonEmpty.optional(),
  currentCompany: nonEmpty.optional(),
  location: nonEmpty.optional(),
  seniority: nonEmpty.optional(),
  skills: z.array(nonEmpty).default([]),
  roleTitle: nonEmpty,
  referrerName: nonEmpty.optional(),
  sourceChannel: nonEmpty.default("openclaw"),
  notes: nonEmpty.optional()
});

export const InteractionInputSchema = z.object({
  candidateId: nonEmpty.optional(),
  candidateName: nonEmpty,
  roleTitle: nonEmpty,
  stage: nonEmpty,
  summary: nonEmpty,
  concerns: z.array(nonEmpty).default([]),
  strengths: z.array(nonEmpty).default([]),
  nextStep: nonEmpty.optional(),
  interactionAt: z.iso.datetime().optional(),
  sourceChannel: nonEmpty.default("openclaw")
});

export const PromiseInputSchema = z.object({
  candidateId: nonEmpty.optional(),
  candidateName: nonEmpty,
  roleTitle: nonEmpty,
  commitment: nonEmpty,
  dueDate: z.iso.date(),
  owner: nonEmpty.default("hiring-team"),
  status: z.enum(["open", "closed"]).default("open"),
  sourceChannel: nonEmpty.default("openclaw")
});

export const ShortlistQuerySchema = z.object({
  roleTitle: nonEmpty,
  query: nonEmpty.default("shortlist candidates"),
  stageIn: z.array(nonEmpty).default([]),
  requiredSkills: z.array(nonEmpty).default([]),
  topK: z.number().int().positive().max(50).default(10)
});

export const CandidateTimelineQuerySchema = z.object({
  candidateName: nonEmpty,
  roleTitle: nonEmpty.optional(),
  topK: z.number().int().positive().max(50).default(12)
});

export const FollowupQuerySchema = z.object({
  fromDate: z.iso.date().optional(),
  toDate: z.iso.date().optional(),
  topK: z.number().int().positive().max(100).default(20)
});

export type CandidateInput = z.infer<typeof CandidateInputSchema>;
export type InteractionInput = z.infer<typeof InteractionInputSchema>;
export type PromiseInput = z.infer<typeof PromiseInputSchema>;
export type ShortlistQuery = z.infer<typeof ShortlistQuerySchema>;
export type CandidateTimelineQuery = z.infer<typeof CandidateTimelineQuerySchema>;
export type FollowupQuery = z.infer<typeof FollowupQuerySchema>;
