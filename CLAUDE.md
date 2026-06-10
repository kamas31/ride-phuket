@AGENTS.md
# MEMORY MANAGEMENT (MANDATORY)

This project is long-term and conversation context will eventually be compacted or lost.

The repository documentation is the source of truth, not conversation memory.

---

## Update docs/ after EVERY change

After every commit — bug fix, feature, refactor, audit, or decision — update the relevant docs/ files in the same session, before responding "done".

Do not wait for a compaction warning. Do not wait for the user to ask.

Files to maintain:

* docs/DECISIONS.md — add an ADR for every significant decision (architectural, product, or technical). Minor fixes go in CHANGELOG only.
* docs/CHANGELOG_AI.md — record every implementation change: files modified, what changed, why.
* docs/ROADMAP.md — mark items done, update Next/In Progress/Later as appropriate.
* docs/PROJECT_CONTEXT.md — update only when the product vision, business model, or architecture changes.

Rules per file:

### docs/DECISIONS.md
- Add an ADR for every accepted decision that has a lasting impact on the codebase.
- Minor UI fixes (< 5 lines) go in CHANGELOG_AI only.
- Include: context, decision, reasoning, files modified.
- Never reopen a documented decision unless explicitly requested.

### docs/CHANGELOG_AI.md
- Record every implementation session under a dated heading (YYYY-MM-DD).
- Include: what changed, which files, why.
- Most recent at the top.

### docs/ROADMAP.md
- After every session: move completed items to Done, update In Progress and Next.
- Add new items discovered during the session.

### docs/PROJECT_CONTEXT.md
- Update only when the business model, pivot, or core architecture changes.
- Not updated for routine fixes.

---

## General rules

1. Never rely solely on conversation memory.
2. Always read docs/PROJECT_CONTEXT.md and docs/DECISIONS.md before proposing major architectural or product changes.
3. If context is becoming large, update documentation before compacting.
4. Repository documentation has priority over conversation history.
5. docs/ files are the source of truth — keep them current at all times.
