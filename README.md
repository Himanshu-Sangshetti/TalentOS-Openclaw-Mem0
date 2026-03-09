# TalentOS — Memory-native hiring copilot for OpenClaw × Mem0

TalentOS is a **memory-native** hiring copilot: it uses **Mem0** for durable, semantic memory and **OpenClaw** for multi-channel conversation. It goes beyond a CRUD chatbot by using OpenClaw lifecycle hooks for auto-recall and auto-capture, and cross-conversation queries that connect information across sessions.

## What makes it memory-native

- **Lifecycle hooks** — Before every turn, relevant hiring context is injected from Mem0 (auto-recall). After every turn, the conversation is sent to Mem0 for fact extraction (auto-capture). The agent doesn’t need to be told “call this tool” for memory to work.
- **Cross-session persistence** — Restart the gateway or start a new chat; the agent still answers from Mem0. See the [multi-session demo](#multi-session-demo).
- **Cross-conversation intelligence** — Queries like “who was referred by Ankit?”, “pipeline health for Staff Engineer”, and “candidates who expressed concerns about startup risk” use semantic search over all hiring memory.
- **Multi-channel** — Same memory across Telegram and Web UI (or any OpenClaw channel). Add a candidate in one, recall in another.


## Features

- Candidate profile capture and interaction logging
- Promise/follow-up tracking
- Shortlist, timeline, and due follow-ups
- **Cross-conversation**: referrer network, pipeline health, concern patterns
- **OpenClaw plugin** with lifecycle hooks (auto-recall, auto-capture) and optional tools

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and set:

- `MEM0_API_KEY` — from [Mem0](https://mem0.ai) dashboard
- Optional: `TALENTOS_USER_ID`, `TALENTOS_API_KEY`, etc.

### 3. Start server

```bash
npm run dev
```

Health check: `GET http://localhost:3010/health`  
Memory view (dashboard): `GET http://localhost:3010/view`

## API

Base: `/api/v1/talent`

| Write | Description |
|-------|-------------|
| `POST /candidates` | Add or update candidate profile |
| `POST /interactions` | Log interview/interaction |
| `POST /promises` | Track follow-up commitment |

| Query | Description |
|-------|-------------|
| `POST /query/shortlist` | Role shortlist (candidates by role/stage/skills) |
| `POST /query/timeline` | Candidate timeline (profile + interactions + promises) |
| `POST /query/followups` | Due follow-ups in date range |
| `POST /query/referrer-network` | Candidates referred by a person |
| `POST /query/pipeline-health` | Pipeline summary for a role |
| `POST /query/concern-patterns` | Candidates who expressed concerns about a topic |

If `TALENTOS_API_KEY` is set, send `Authorization: Bearer <key>`.

### Example: add candidate

```bash
curl -X POST http://localhost:3010/api/v1/talent/candidates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rohan Gupta",
    "roleTitle": "Founding AI Engineer",
    "currentCompany": "Stripe",
    "location": "Bangalore",
    "skills": ["agents", "infra", "python"],
    "referrerName": "Priya"
  }'
```

## OpenClaw plugin

`openclaw-plugin/` provides:

- **Lifecycle hooks** (when `mem0ApiKey` is set):
  - `before_prompt_build` — inject relevant hiring memory (auto-recall)
  - `agent_end` — send last messages to Mem0 for extraction (auto-capture)
- **Optional tools** (call TalentOS API):
  - `talentos_add_candidate`, `talentos_log_interaction`, `talentos_track_promise`
  - `talentos_shortlist_candidates`, `talentos_candidate_timeline`, `talentos_followups_due`
  - `talentos_referrer_network`, `talentos_pipeline_health`, `talentos_concern_patterns`

Setup: [docs/OPENCLAW_SETUP.md](./docs/OPENCLAW_SETUP.md). Multi-channel (e.g. Telegram + Web UI): [docs/MULTI_CHANNEL.md](./docs/MULTI_CHANNEL.md).

## Scripts

- **Smoke test** — full write/read flow (candidates, interactions, promises, timeline, shortlist, followups):
  ```bash
  npm run smoke
  ```
- **Multi-session demo** — Phase 1: seed data; Phase 2: “who are we hiring?” style queries (shortlist, pipeline health, referrer network, concern patterns). Optional: restart gateway between phases to prove persistence.
  ```bash
  npm run demo:multi-session
  ```
  Run only Phase 2: `npx tsx scripts/demo-multi-session.ts --phase2-only`

## Memory visible

Open **http://localhost:3010/view** in a browser to see a minimal dashboard: pipeline summary and recent memories from Mem0 (same data the agent uses for recall). If the server uses `TALENTOS_API_KEY`, enter it in the dashboard once.

## Automated workflows (OpenClaw)

Beyond chat, OpenClaw can run the same agent from **webhooks** (e.g. ATS → add candidate) and **cron** (e.g. daily “due follow-ups” digest to Telegram). One memory store, multiple trigger types.

- [docs/WEBHOOK_WORKFLOW.md](./docs/WEBHOOK_WORKFLOW.md) — event-driven: POST /hooks/agent
- [docs/CRON_WORKFLOW.md](./docs/CRON_WORKFLOW.md) — scheduled: daily digest, reminders

## Docs

- [docs/OPENCLAW_SETUP.md](./docs/OPENCLAW_SETUP.md) — plugin install and agent config
- [docs/MULTI_CHANNEL.md](./docs/MULTI_CHANNEL.md) — same memory across Telegram and Web UI
- [docs/MEMORY_SCHEMA.md](./docs/MEMORY_SCHEMA.md) — memory entity types and metadata

## License

ISC. Built for OpenClaw × Mem0; extensible to other memory-driven workflows (e.g. SalesOps, SupportOps).
