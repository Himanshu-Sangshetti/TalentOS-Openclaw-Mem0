# TalentOS for OpenClaw x Mem0

TalentOS is a memory-native hiring copilot backend designed for OpenClaw agents.
It provides production-ready hiring workflows on top of Mem0:

- Candidate profile capture
- Interview/interaction logging
- Promise/follow-up tracking
- Retrieval for shortlists, timelines, and due follow-ups

This project follows official docs and APIs:

- Mem0 Add Memories: `POST /v1/memories/`
- Mem0 Search Memories v2: `POST /v2/memories/search/`
- OpenClaw plugin manifest and tool registration model

## Why this exists

OpenClaw gives teams a multi-channel conversational surface. Mem0 gives those
agents durable memory across sessions. TalentOS adds hiring-domain structure so
recruiting context does not disappear between chats, interview rounds, and
handoffs.

## Architecture

1. OpenClaw agent calls TalentOS tools (via plugin) or TalentOS API directly.
2. TalentOS converts events into structured memory entries and metadata.
3. TalentOS writes to Mem0 (`/v1/memories/`) and reads using Mem0 v2 filters (`/v2/memories/search/`).
4. OpenClaw agents retrieve grounded hiring context from Mem0 instead of relying
   on short-term prompt context.

## Local setup

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment

Copy `.env.example` to `.env` and fill values:

- `MEM0_API_KEY` from Mem0 dashboard
- optional custom IDs (`TALENTOS_USER_ID`, etc.)
- optional service auth (`TALENTOS_API_KEY`) if you want API-level bearer protection

### 3) Start server

```bash
npm run dev
```

Health check:

```bash
GET http://localhost:3010/health
```

## API endpoints

Base: `/api/v1/talent`

- `POST /candidates`
- `POST /interactions`
- `POST /promises`
- `POST /query/shortlist`
- `POST /query/timeline`
- `POST /query/followups`

If `TALENTOS_API_KEY` is configured, add:

```bash
Authorization: Bearer <TALENTOS_API_KEY>
```

### Example: add candidate

```bash
curl -X POST http://localhost:3010/api/v1/talent/candidates \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Rohan Gupta",
    "roleTitle":"Founding AI Engineer",
    "currentCompany":"Stripe",
    "location":"Bangalore",
    "skills":["agents","infra","python"],
    "referrerName":"Priya"
  }'
```

## OpenClaw plugin

This repo includes `openclaw-plugin/` with:

- `openclaw.plugin.json` manifest
- optional tools:
  - `talentos_add_candidate`
  - `talentos_log_interaction`
  - `talentos_track_promise`
  - `talentos_shortlist_candidates`
  - `talentos_candidate_timeline`
  - `talentos_followups_due`

These tools call the TalentOS API so OpenClaw agents can run structured hiring
workflows while Mem0 handles persistence and recall.

## Notes

- Built for clean extensibility and open-source collaboration.
- Current v1 scope is hiring workflows; same architecture can later support
  SalesOps, SupportOps, and InvestorOps memory workflows.

## Smoke test harness

With server running, execute an end-to-end hiring scenario:

```bash
npm run smoke
```

This validates candidate creation, interaction logging, promise tracking,
timeline retrieval, shortlist query, and due followups.
