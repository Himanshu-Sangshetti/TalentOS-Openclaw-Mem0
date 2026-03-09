import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3010),
  MEM0_API_KEY: z.string().min(1, "MEM0_API_KEY is required"),
  MEM0_BASE_URL: z.url().default("https://api.mem0.ai"),
  TALENTOS_USER_ID: z.string().min(1).default("talentos-default"),
  TALENTOS_API_KEY: z.string().optional(),
  MEM0_TIMEOUT_MS: z.coerce.number().int().positive().default(12000),
  MEM0_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
  MEM0_RETRY_DELAY_MS: z.coerce.number().int().positive().default(400),
});

export type RuntimeConfig = z.infer<typeof EnvSchema>;

export const env: RuntimeConfig = EnvSchema.parse(process.env);
