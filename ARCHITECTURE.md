# TalentOS Architecture — OpenClaw × Mem0

TalentOS is a **memory-native** hiring copilot: it uses Mem0 for durable, semantic memory and OpenClaw for multi-channel conversation. This document describes how the pieces fit together and what makes it more than a CRUD chatbot.

## High-level flow

```
┌─────────────────┐     tools + lifecycle      ┌──────────────────┐     REST      ┌─────────────┐
│  OpenClaw       │ ──────────────────────────►│  TalentOS        │ ◄────────────►│  Mem0       │
│  (gateway +     │   before_prompt_build      │  (Node API)      │   /v1/memories │  (cloud or  │
│   agents)       │   agent_end                │                 │   /v2/search   │   self-host)│
└─────────────────┘                            └──────────────────┘               └─────────────┘
```

- **OpenClaw**: Routes messages from Telegram, Web UI, etc., to agents; runs the TalentOS plugin (lifecycle hooks + tools).
- **TalentOS**: Converts hiring events into structured memory writes and answers cross-conversation queries via Mem0 search.
- **Mem0**: Stores and retrieves memories by semantic similarity and optional filters; persists across sessions and restarts.

## What makes it memory-native

### 1. Lifecycle hooks (not just tools)

The plugin uses OpenClaw lifecycle hooks so memory behavior is automatic:

| Hook                 | When it runs           | What it does |
|----------------------|------------------------|--------------|
| `before_prompt_build`| Before each user turn  | **Auto-recall**: Searches Mem0 with the user’s prompt and injects a `<hiring-memory>` block so the agent answers from long-term context without a tool call. |
| `agent_end`          | After each agent turn  | **Auto-capture**: Sends the last few messages to Mem0 for fact extraction so candidate/interaction info is stored even when the user doesn’t say “add candidate.” |

So:

- The agent doesn’t have to be told “call this tool” for recall or capture.
- Memory is always in the loop; tools are for **structured** hiring actions (add candidate, log interaction, track promise, run cross-conversation queries).

### 2. Cross-session persistence

Mem0 holds state. When you:

1. Add candidates and interactions in one session,
2. Restart the OpenClaw gateway (or start a new chat),
3. Ask “who are we hiring?” or “who was referred by Ankit?”,

the agent answers from Mem0. No in-process database; memory survives restarts. The **multi-session demo** (`npm run demo:multi-session`) shows this: Phase 1 seeds data, Phase 2 queries it; you can restart between phases to prove persistence.

### 3. Cross-conversation intelligence

Queries connect information across separate conversations:

- **Referrer network**: “Who was referred by Ankit?” — semantic search over candidates by referrer.
- **Pipeline health**: “What’s our pipeline for Staff Engineer?” — aggregate view of candidates and stages for a role.
- **Concern patterns**: “Candidates who expressed concerns about startup risk?” — search over interaction concerns.

These use Mem0’s semantic search over natural-language memory content, not just key–value lookups.

### 4. Multi-channel, same memory

OpenClaw can attach multiple channels (e.g. Telegram and Web UI) to the same agent. The plugin and TalentOS use a single `userId` (and optional `agentId`) for Mem0, so:

- Add a candidate in Telegram.
- Later ask in the Web UI “who are we hiring?” — the same Mem0 memory backs both.

That’s the value of OpenClaw here: one memory store, many surfaces.

## Components

### TalentOS API (`src/`)

- **Routes** (`src/routes/talentRoutes.ts`): POST endpoints for candidates, interactions, promises, and query endpoints (shortlist, timeline, followups, referrer-network, pipeline-health, concern-patterns).
- **TalentMemoryService** (`src/services/talentMemoryService.ts`): Domain logic; builds natural-language memory content and metadata, calls Mem0 client for add and search; dedupes and shapes results.
- **Mem0 client** (`src/mem0/`): Typed wrapper for Mem0 `POST /v1/memories/` and `POST /v2/memories/search/`.
- **Schemas** (`src/domain/schemas.ts`): Zod schemas for all request bodies.

Writes go to Mem0 with structured metadata where supported (e.g. `entity_type`, `candidate_id`, `role_title`); retrieval uses **semantic search** keyed by `user_id` so it works consistently on Mem0 Cloud (including Free tier where custom metadata may not be persisted).

### OpenClaw plugin (`openclaw-plugin/`)

- **Lifecycle**: Registers `before_prompt_build` (auto-recall) and `agent_end` (auto-capture) when `mem0ApiKey` is set.
- **Tools**: Register optional tools that call the TalentOS API (add candidate, log interaction, track promise, shortlist, timeline, followups, referrer network, pipeline health, concern patterns).
- **Config**: `openclaw.plugin.json` defines config schema and UI hints; plugin reads `baseUrl`, `mem0ApiKey`, `userId`, etc.

### Mem0

- **Add**: One or more messages per request; Mem0 infers memories and optionally graph links.
- **Search**: v2 search with `query`, `user_id` filter, `top_k`, `threshold`, `rerank`. No reliance on complex metadata filters for core behavior.

## Configuration

- **TalentOS**: `.env` — `MEM0_API_KEY`, `TALENTOS_USER_ID`, optional `TALENTOS_API_KEY`, etc.
- **Plugin**: In OpenClaw config, plugin `config.baseUrl` (TalentOS API), `config.mem0ApiKey` (for hooks), `config.userId` (Mem0 scope). Same `userId` across channels for shared memory.

## Demo and validation

- **Smoke test** (`npm run smoke`): End-to-end write + read (candidates, interactions, promises, timeline, shortlist, followups) plus indexing wait.
- **Multi-session demo** (`npm run demo:multi-session`): Phase 1 seeds data; Phase 2 runs “who are we hiring?” style queries (shortlist, pipeline health, referrer network, concern patterns). Optional restart between phases to show cross-session persistence.

## Summary

TalentOS is memory-native because:

1. **Lifecycle hooks** provide auto-recall and auto-capture, not only on-demand tool use.
2. **Mem0** provides cross-session persistence and semantic retrieval.
3. **Cross-conversation queries** (referrer network, pipeline health, concern patterns) use that semantic layer.
4. **OpenClaw** enables the same memory across multiple channels (e.g. Telegram + Web UI).

Together, this goes beyond a CRUD chatbot to a hiring copilot that remembers across sessions and channels and answers connected questions over many conversations.
