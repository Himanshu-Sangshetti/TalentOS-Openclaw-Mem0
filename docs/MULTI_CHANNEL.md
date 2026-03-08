# Multi-channel memory (Telegram + Web UI)

TalentOS uses a single Mem0 `user_id` (and optional `agent_id`) for the plugin. That means **all channels** connected to the same OpenClaw agent share the same hiring memory.

## Why it matters

- Add a candidate in **Telegram**.
- Later open **Web UI** and ask “who are we hiring?” — the agent answers from the same Mem0 memory.
- No separate databases per channel; one memory store, many surfaces. That’s the value of OpenClaw here.

## How to test

1. **Configure one agent** with the TalentOS plugin and Mem0 config (`mem0ApiKey`, `userId`).
2. **Attach two channels** to that agent (e.g. Telegram and Web UI), using OpenClaw’s channel setup.
3. **In channel A**: Add a candidate or log an interaction (via chat or tools).
4. **In channel B**: Ask “what do we know about [candidate]?” or “shortlist for [role]?” — you should see the data from channel A.

Auto-recall runs on every prompt in both channels, so relevant hiring context is injected regardless of where the user is chatting.

## Configuration

In the plugin config (e.g. in `openclaw.json`), use the same `userId` for all channels that should share memory:

```json
{
  "plugins": {
    "entries": {
      "talentos-hiring": {
        "enabled": true,
        "config": {
          "baseUrl": "http://127.0.0.1:3010",
          "mem0ApiKey": "<your-mem0-key>",
          "userId": "talentos-default"
        }
      }
    }
  }
}
```

If you need **separate** memory per channel (e.g. different workspaces), use different agent IDs or user IDs in separate agent configs and point each channel to the right agent.
