# Setup

## 1. Install plugin

Copy the full plugin (including `skills/`) into OpenClaw extensions:

```bash
# Windows (PowerShell)
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.openclaw\extensions\talentos-hiring"
Copy-Item -Path "H:\Mem0\openclaw-plugin\*" -Destination "$env:USERPROFILE\.openclaw\extensions\talentos-hiring\" -Recurse -Force
```

Check that `%USERPROFILE%\.openclaw\extensions\talentos-hiring\skills\talentos-hiring\SKILL.md` exists.

## 2. Config

In `~/.openclaw/openclaw.json`:

- **Plugin:** `plugins.entries["talentos-hiring"].enabled: true`, `config.mem0ApiKey`, `config.userId`. Do **not** set `baseUrl` or `apiKey` (tools run in-process).
- **Tools:** add to `tools.allow`:  
  `talentos_add_candidate`, `talentos_log_interaction`, `talentos_track_promise`, `talentos_candidate_timeline`, `talentos_shortlist_candidates`, `talentos_followups_due`, `talentos_referrer_network`, `talentos_pipeline_health`, `talentos_concern_patterns`, `talentos_daily_brief`, `talentos_send_email` (if using Resend), `group:memory`.

Example plugin config:

```json
"talentos-hiring": {
  "enabled": true,
  "config": {
    "mem0ApiKey": "<your-mem0-api-key>",
    "userId": "talentos-default"
  }
}
```

## 3. Run

```bash
openclaw gateway --force
```

## 4. Optional

- **View server (dashboard):** In this repo: `npm install`, `.env` with `MEM0_API_KEY`, `npm run dev` → http://localhost:3010/view.
- **Resend email:** Add `resendApiKey` and `resendFrom` to plugin config, add `talentos_send_email` to `tools.allow`.
- **Cron / webhook / Ollama:** See OpenClaw docs; LLM and scheduling are configured in `~/.openclaw/openclaw.json`, not this repo.




Tests: `npm run test`. Smoke: start server, then `npm run smoke`.
