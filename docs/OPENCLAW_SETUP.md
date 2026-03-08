# OpenClaw Setup for TalentOS

This guide wires OpenClaw to the TalentOS API and Mem0-backed hiring memory.

## Prerequisites

- Node.js 22+ for OpenClaw
- OpenClaw installed and configured
- TalentOS API running locally (`npm run dev`)

## 1) Install the plugin locally

Copy this repo plugin folder into OpenClaw extensions:

```bash
mkdir -p ~/.openclaw/extensions/talentos-hiring
cp -r openclaw-plugin/* ~/.openclaw/extensions/talentos-hiring/
```

## 2) Add plugin config in `~/.openclaw/openclaw.json`

```json5
{
  plugins: {
    entries: {
      "talentos-hiring": {
        enabled: true,
        config: {
          baseUrl: "http://127.0.0.1:3010"
          // apiKey: "optional-if-TALENTOS_API_KEY-is-enabled"
        }
      }
    }
  }
}
```

## 3) Allow optional plugin tools for your hiring agent

```json5
{
  agents: {
    list: [
      {
        id: "hiring",
        tools: {
          allow: [
            "talentos_add_candidate",
            "talentos_log_interaction",
            "talentos_track_promise",
            "talentos_shortlist_candidates",
            "talentos_candidate_timeline",
            "talentos_followups_due",
            "talentos_referrer_network",
            "talentos_pipeline_health",
            "talentos_concern_patterns",
            "group:memory"
          ]
        }
      }
    ]
  }
}
```

## 4) Restart OpenClaw gateway

```bash
openclaw gateway --force
```

## 5) Recommended hiring agent prompt

In your hiring workspace `AGENTS.md`, include a policy like:

- Always store candidate profile updates via `talentos_add_candidate`.
- Always log interview round outcomes via `talentos_log_interaction`.
- Always track explicit commitments via `talentos_track_promise`.
- Use `talentos_shortlist_candidates` for role-level ranking questions.
- Use `talentos_candidate_timeline` before giving status updates.
- Before suggesting outreach plans, call `talentos_followups_due`.
- For “who was referred by X?” use `talentos_referrer_network`.
- For “pipeline health for role X?” use `talentos_pipeline_health`.
- For “candidates who expressed concerns about X?” use `talentos_concern_patterns`.
- Prefer memory-grounded answers; avoid unsupported assumptions.

