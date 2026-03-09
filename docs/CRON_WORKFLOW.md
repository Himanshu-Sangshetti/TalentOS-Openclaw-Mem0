# Cron-driven workflow (OpenClaw)

Use OpenClaw’s **cron** to run the hiring agent on a schedule (e.g. daily “due follow-ups” or “pipeline summary”) and deliver the result to a channel. Same agent, same Mem0 memory — so this is **scheduled automation**, not a separate script.

## Why this matters

Cron gives you **proactive** workflows: the agent runs at a fixed time with a prompt, uses recall + tools, and posts to Telegram/Discord/Slack. Example: every morning at 9am, “What follow-ups are due? Summarize pipeline for Staff Engineer.” That’s the harness pattern: **schedule → gateway → agent + memory → delivery**.

## Prerequisites

- OpenClaw gateway running with a hiring agent (TalentOS plugin + tools).
- Cron is built into the gateway; jobs are stored under `~/.openclaw/cron/`.

## Add a recurring “daily digest” job

From the machine where the gateway runs:

```bash
openclaw cron add \
  --name "Hiring daily digest" \
  --cron "0 9 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "What follow-ups are due this week? Summarize pipeline for Staff Engineer. Keep it short and actionable." \
  --announce \
  --channel telegram
```

- `--cron "0 9 * * *"`: 9:00 AM every day (cron expression).
- `--tz`: IANA timezone for the schedule.
- `--session isolated`: Run a dedicated agent turn (recommended for cron).
- `--message`: The prompt; the agent will use Mem0 recall and tools (`talentos_followups_due`, `talentos_pipeline_health`, etc.).
- `--announce`: Send the agent’s reply to the channel.
- `--channel telegram`: Deliver to Telegram (or `discord`, `slack`, etc.).

If you use multiple agents, add `--agent-id hiring` (or your agent id) so the job runs under the hiring agent with TalentOS tools.

## One-shot reminder

Example: run once at a specific time, then remove the job.

```bash
openclaw cron add \
  --name "Pipeline check" \
  --at "2026-03-15T14:00:00Z" \
  --session isolated \
  --message "Summarize pipeline for Staff Engineer." \
  --announce \
  --channel telegram \
  --wake now \
  --delete-after-run
```

## List and manage jobs

```bash
openclaw cron list
openclaw cron run <job-id>
openclaw cron runs --id <job-id>
```

## Summary

- **Cron** runs the hiring agent on a schedule with a fixed prompt.
- Agent uses **Mem0 recall** and **TalentOS tools** (followups, pipeline, etc.).
- Output is **delivered to a channel** (Telegram, Discord, Slack).
- Same memory as chat and webhooks — one harness, multiple trigger types.
