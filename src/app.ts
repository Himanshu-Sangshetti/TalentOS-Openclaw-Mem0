import express from "express";
import path from "path";
import { env } from "./config/env.js";
import { Mem0Client } from "./mem0/client.js";
import { createViewRoutes } from "./routes/viewRoutes.js";

const app = express();
const mem0 = new Mem0Client({
  apiKey: env.MEM0_API_KEY,
  baseUrl: env.MEM0_BASE_URL,
  timeoutMs: env.MEM0_TIMEOUT_MS,
  maxRetries: env.MEM0_MAX_RETRIES,
  retryDelayMs: env.MEM0_RETRY_DELAY_MS
});

app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "talentos-openclaw-mem0",
    message: "View-only server: /health, /view (dashboard), /api/v1/talent/view. Hiring runs in OpenClaw plugin → Mem0."
  });
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "talentos-openclaw-mem0",
    env: env.NODE_ENV
  });
});

// Memory visibility dashboard
app.get("/view", (_req, res) => {
  const dashboardPath = path.join(process.cwd(), "public", "dashboard.html");
  res.sendFile(dashboardPath);
});

app.use((req, res, next) => {
  if (!env.TALENTOS_API_KEY) {
    next();
    return;
  }
  const authHeader = req.header("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (token !== env.TALENTOS_API_KEY) {
    res.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }
  next();
});

app.use("/api/v1/talent", createViewRoutes(mem0, env.TALENTOS_USER_ID));

const server = app.listen(env.PORT, () => {
  console.log(`TalentOS view server listening on http://localhost:${env.PORT}`);
});

function shutdown(signal: string): void {
  console.log(`${signal} received, closing server`);
  server.close(() => process.exit(0));
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
