# Setup and run

## 1. Install plugin

```bash
mkdir -p ~/.openclaw/extensions/talentos-hiring
cp -r openclaw-plugin/* ~/.openclaw/extensions/talentos-hiring/
```

## 2. Config in `~/.openclaw/openclaw.json`

**Plugin:** `mem0ApiKey` and `userId` required.

```json5
{
  plugins: {
    entries: {
      "talentos-hiring": {
        enabled: true,
        config: {
          mem0ApiKey: "<your-mem0-api-key>",
          userId: "talentos-default"
        }
      }
    }
  }
}
```

**Tools:** allow the 10 TalentOS tools (and `group:memory`) for your hiring agent, e.g. under `agents.list[].tools.allow`:

```json
["talentos_add_candidate", "talentos_log_interaction", "talentos_track_promise", "talentos_candidate_timeline", "talentos_shortlist_candidates", "talentos_followups_due", "talentos_referrer_network", "talentos_pipeline_health", "talentos_concern_patterns", "talentos_daily_brief", "group:memory"]
```

## 3. Restart gateway

```bash
openclaw gateway --force
```

The plugin ships the skill at `skills/talentos-hiring/SKILL.md`; OpenClaw loads it when the plugin is enabled.

## 4. Optional view server (dashboard)

In this repo: `npm install`, copy `.env.example` → `.env`, set `MEM0_API_KEY`. Run `npm run dev` → http://localhost:3010/view.

## 5. Test in chat

Start gateway, connect Telegram or Web UI, select hiring agent. Example prompts: *"Add Priya Sharma, Staff Engineer, referred by Ankit"*; *"Log interaction for Priya: screening, strong on system design, stage technical"*; *"Shortlist for Staff Engineer"*; *"Daily brief for Staff Engineer"*. Unit tests: `npm run test`. Smoke: start server, then `npm run smoke`.

---

## Optional: cron (daily brief)

```bash
openclaw cron add --name "Hiring daily digest" --cron "0 9 * * *" --tz "America/Los_Angeles" \
  --session isolated \
  --message "Generate the daily hiring brief for Staff Engineer. Call talentos_daily_brief (lookaheadDays=7, staleDays=7) and post the summary." \
  --announce --channel telegram
```

## Optional: webhook

In `openclaw.json`: `hooks.enabled: true`, `hooks.token`, `hooks.allowedAgentIds: ["hiring"]`. POST to `/hooks/agent` with `message`, `agentId: "hiring"`, optional `deliver` and `channel`.

## Optional: email

Install an OpenClaw email skill (e.g. `npx clawhub@latest install smtp-send`), configure it, add its tool (e.g. `smtp_send`) to your hiring agent’s `tools.allow`. The TalentOS skill tells the agent when to use it.

---

## LLM provider (if credits run out)

OpenClaw uses its own config for the LLM, not this repo’s `.env`.

- **New Anthropic key:** set `ANTHROPIC_API_KEY` or set `models.providers.anthropic.apiKey` in `~/.openclaw/openclaw.json`.
- **OpenAI:** set `models.providers.openai.apiKey`, `defaults.provider: "openai"`, `defaults.model: "gpt-4o-mini"`.
- **Ollama (local):** install Ollama, `ollama pull llama3.2`. Set `OLLAMA_API_KEY=ollama-local` or in config set `providers.ollama` with `baseUrl: "http://127.0.0.1:11434"`, `api: "ollama"`, and `defaults.provider: "ollama"`, `defaults.model: "llama3.2"`. No `/v1` in baseUrl.

After any config change: `openclaw gateway --force`.
