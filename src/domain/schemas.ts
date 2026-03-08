import { z } from "zod";

const nonEmpty = z.string().trim().min(1);
const optionalString = z
  .string()
  .optional()
  .transform((v) => (v && v.trim().length > 0 ? v.trim() : undefined));
const optionalEmail = z
  .union([z.email(), z.literal("")])
  .optional()
  .transform((v) => (v && v.trim().length > 0 ? v.trim() : undefined));
export const HiringStageSchema = z.enum([
  "sourced",
  "screening",
  "assignment",
  "technical",
  "onsite",
  "decision",
  "offer",
  "hired",
  "rejected"
]);

export const CandidateInputSchema = z.object({
  candidateId: optionalString,
  name: nonEmpty,
  email: optionalEmail,
  phone: optionalString,
  currentCompany: optionalString,
  location: optionalString,
  seniority: optionalString,
  skills: z.array(nonEmpty).default([]),
  roleTitle: nonEmpty,
  currentStage: HiringStageSchema.optional(),
  referrerName: optionalString,
  sourceChannel: nonEmpty.default("openclaw"),
  notes: optionalString
});

export const InteractionInputSchema = z.object({
  candidateId: nonEmpty.optional(),
  candidateName: nonEmpty,
  roleTitle: nonEmpty,
  stage: HiringStageSchema,
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
  stageIn: z.array(HiringStageSchema).default([]),
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

/** Cross-conversation: candidates referred by a specific person */
export const ReferrerNetworkQuerySchema = z.object({
  referrerName: nonEmpty,
  roleTitle: nonEmpty.optional(),
  topK: z.number().int().positive().max(50).default(15)
});

/** Cross-conversation: pipeline summary by role (stage counts, active candidates) */
export const PipelineHealthQuerySchema = z.object({
  roleTitle: nonEmpty,
  topK: z.number().int().positive().max(100).default(30)
});

/** Cross-conversation: candidates who expressed concerns matching a topic */
export const ConcernPatternsQuerySchema = z.object({
  concernTopic: nonEmpty,
  roleTitle: nonEmpty.optional(),
  topK: z.number().int().positive().max(50).default(15)
});

export type CandidateInput = z.infer<typeof CandidateInputSchema>;
export type InteractionInput = z.infer<typeof InteractionInputSchema>;
export type PromiseInput = z.infer<typeof PromiseInputSchema>;
export type ShortlistQuery = z.infer<typeof ShortlistQuerySchema>;
export type CandidateTimelineQuery = z.infer<typeof CandidateTimelineQuerySchema>;
export type FollowupQuery = z.infer<typeof FollowupQuerySchema>;
export type ReferrerNetworkQuery = z.infer<typeof ReferrerNetworkQuerySchema>;
export type PipelineHealthQuery = z.infer<typeof PipelineHealthQuerySchema>;
export type ConcernPatternsQuery = z.infer<typeof ConcernPatternsQuerySchema>;
export type HiringStage = z.infer<typeof HiringStageSchema>;
