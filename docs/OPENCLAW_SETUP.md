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
            "talentos_followups_due",
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
- Before suggesting outreach plans, call `talentos_followups_due`.
- Prefer memory-grounded answers; avoid unsupported assumptions.

