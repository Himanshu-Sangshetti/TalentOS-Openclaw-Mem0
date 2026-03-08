# TalentOS Memory Schema

TalentOS stores structured hiring context in Mem0 using metadata for reliable
filtering and retrieval.

## Shared identifiers

- `user_id`: startup/workspace scope (`TALENTOS_USER_ID`)
- `agent_id`: workflow owner (`TALENTOS_AGENT_ID`)
- `app_id`: application namespace (`TALENTOS_APP_ID`)

## Entity types

All memories include:

- `entity_type`: `candidate | interaction | promise`

### Candidate

- `candidate_id`
- `candidate_name`
- `candidate_email`
- `candidate_phone`
- `role_title`
- `current_stage`
- `referrer_name`
- `skills` (array)
- `source_channel`
- `saved_on`

### Interaction

- `candidate_id`
- `candidate_name`
- `role_title`
- `stage`
- `next_step`
- `strengths` (array)
- `concerns` (array)
- `source_channel`
- `interaction_at`

Normalized stage values:

- `sourced`
- `screening`
- `assignment`
- `technical`
- `onsite`
- `decision`
- `offer`
- `hired`
- `rejected`

### Promise

- `candidate_id`
- `candidate_name`
- `role_title`
- `promise_owner`
- `promise_status` (`open|closed`)
- `due_date` (`YYYY-MM-DD`)
- `source_channel`

## Retrieval strategy

TalentOS uses Mem0 v2 filters:

- Candidate shortlist:
  - `entity_type = candidate`
  - `role_title = <target role>`
  - optional skill filters
- Candidate timeline:
  - `candidate_name = <name>`
- Due followups:
  - `entity_type = promise`
  - `promise_status = open`
  - optional date window on `due_date`

