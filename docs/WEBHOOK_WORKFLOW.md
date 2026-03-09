# Webhook-driven workflow (OpenClaw)

Use OpenClaw’s **incoming webhook** so external systems (ATS, forms, calendar) can trigger the hiring agent. The agent runs with full memory and tools; it can add candidates, log interactions, and optionally reply to a channel.

## Why this matters

Without webhooks, the only trigger is human chat. With webhooks, you get **event-driven automation**: e.g. “New applicant from Greenhouse” → POST to OpenClaw → agent adds candidate to Mem0 and can post a summary to Slack/Telegram. That’s the harness pattern: **events → gateway → agent + memory → actions + delivery**.

## Prerequisites

- OpenClaw gateway running with hooks enabled and a hiring agent that has the TalentOS plugin and tools.
- Hook token configured in OpenClaw (`hooks.token` in config).

## Enable webhooks in OpenClaw

In `~/.openclaw/openclaw.json` (or your config):

```json5
{
  hooks: {
    enabled: true,
    token: "YOUR_HOOK_TOKEN",
    path: "/hooks",
    allowedAgentIds: ["hiring"],
  },
}
```

Restart the gateway. The endpoint will be `http://<gateway-host>:<port>/hooks/agent`.

## Trigger the hiring agent from outside

**POST /hooks/agent** — Run one agent turn with a message. The hiring agent will have recall (Mem0) and tools (e.g. `talentos_add_candidate`). You can optionally deliver the agent’s reply to a channel.

Example: new applicant from an ATS or form.

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H "Authorization: Bearer YOUR_HOOK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "New applicant: Jane Doe, Staff Engineer, from LinkedIn. Add her to the pipeline.",
    "name": "ATS",
    "agentId": "hiring",
    "deliver": true,
    "channel": "telegram"
  }'
```

- `message`: The prompt the agent sees (and can act on with tools).
- `name`: Label for the hook (e.g. "ATS", "Greenhouse").
- `agentId`: Must match your hiring agent id so it uses the TalentOS plugin and Mem0.
- `deliver`: If `true`, the agent’s reply is sent to the channel.
- `channel`: `telegram`, `whatsapp`, `discord`, `slack`, etc., or `last` for last-used channel.

The agent will use auto-recall (relevant hiring context from Mem0) and can call `talentos_add_candidate` (or other tools). Memory is updated in Mem0; the same memory is used in chat and in future webhook runs.

## Optional: reply to a specific chat

Use `to` to target a recipient (e.g. phone number for WhatsApp, chat ID for Telegram):

```json
{
  "message": "Summarize pipeline for Staff Engineer.",
  "name": "Daily digest",
  "agentId": "hiring",
  "deliver": true,
  "channel": "telegram",
  "to": "123456789"
}
```

## Summary

- **Inbound webhook** → OpenClaw runs the hiring agent with memory and tools.
- **One memory store** (Mem0) for chat and webhook-triggered runs.
- This is the first automated workflow in the harness: event-driven, not only human-in-the-loop.
