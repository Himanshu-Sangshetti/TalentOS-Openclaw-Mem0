import express from "express";
import path from "path";
import { env } from "./config/env.js";
import { createTalentRoutes } from "./routes/talentRoutes.js";
import { TalentMemoryService } from "./services/talentMemoryService.js";

const app = express();
const service = new TalentMemoryService(env);

app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "talentos-openclaw-mem0",
    message: "TalentOS API is live. Use /health, /view (dashboard), or /api/v1/talent/* endpoints."
  });
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "talentos-openclaw-mem0",
    env: env.NODE_ENV
  });
});

// Memory visibility dashboard (no auth required to load page; API fetch may need Bearer if TALENTOS_API_KEY is set)
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

app.use("/api/v1/talent", createTalentRoutes(service));

app.listen(env.PORT, () => {
  console.log(`TalentOS API running on http://localhost:${env.PORT}`);
});
