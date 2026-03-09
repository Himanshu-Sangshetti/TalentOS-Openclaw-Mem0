# TalentOS

Memory-native hiring copilot for **OpenClaw × Mem0**: plugin (skill + auto-recall/auto-capture + 10 tools) talks to Mem0; optional view server for a dashboard. Scope: pipeline, interactions, follow-ups, daily brief; optional email via an installed skill. Not job reqs/scheduling/ATS.

## Quick start

1. **Repo:** `npm install`. Copy `.env.example` → `.env`, set `MEM0_API_KEY`.
2. **OpenClaw:** Install plugin, set `mem0ApiKey` and `userId`, allow the 10 TalentOS tools for your agent, restart gateway. → [Setup](docs/SETUP.md)
3. **Optional dashboard:** `npm run dev` → http://localhost:3010/view

## Repo layout

- **openclaw-plugin/** — Skill (`skills/talentos-hiring/SKILL.md`), hooks (recall, capture), 10 tools → Mem0. Hiring runs here; no separate API.
- **View server** — `npm run dev` / `npm start`: `/`, `/health`, `/view`, `GET /api/v1/talent/view`. Read-only.

## Scripts

| Command | Purpose |
|--------|--------|
| `npm run dev` | View server (tsx). |
| `npm run build` | Compile TypeScript. |
| `npm start` | Run view server (node). |
| `npm run test` | Unit tests. |
| `npm run smoke` | Hit `/`, `/health`, `/api/v1/talent/view` (server must be running). |

## Docs

- **[ARCHITECTURE](docs/ARCHITECTURE.md)** — System diagram, scope, all 10 tools, hooks, skill, view server, cron, webhook, multi-channel, memory schema.
- **[SETUP](docs/SETUP.md)** — Install plugin, config, tools allowlist, view server, test steps, LLM provider (Ollama/Anthropic/OpenAI), optional cron/webhook/email.

License: ISC. See [LICENSE](LICENSE), [CONTRIBUTING](CONTRIBUTING.md), [SECURITY](SECURITY.md).
