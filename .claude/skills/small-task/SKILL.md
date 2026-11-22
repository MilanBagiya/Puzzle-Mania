---
name: small-task
description: The required workflow for EVERY coding or file task in the Puzzle-Mania / Fresh Snow project. Use it whenever you are asked to create, edit, delete, install, build, test or fix anything, even a one-line change, and whenever a message starts with "Task". It keeps work small, safe and reviewable and defines the report format the owner pastes back to his reviewer.
---

# Small task workflow

The owner works with a reviewer who checks every result, so follow these steps exactly.

## 1. Understand
- Re-read CLAUDE.md. Read only the docs/ sections the task needs.
- Restate the task in one sentence. If anything is unclear, ask ONE question and stop.

## 2. Plan, then wait
Reply with a plan of 3 to 6 bullets: files you will create or change (full paths under
D:/Projects/Puzzle-Mania), commands you will run, and how you will check the result.
Then STOP and wait for "OK". Do not write code before approval.

## 3. Do the smallest change
- Touch only the files in the approved plan.
- Never write outside D:/Projects/Puzzle-Mania.
- Never add a dependency, service or cost that was not approved.
- Never invent facts, ratings, numbers or domain names.
- If you hit a problem the plan did not expect, stop and explain instead of improvising.

## 4. Check
Run the relevant checks and read their output honestly:
- `pnpm test` (or the package's test command) when code changed
- `pnpm build` when the site changed
- `git status` always

## 5. Report in this exact format
```
TASK: <one sentence>
FILES CHANGED: <list of paths, or "none">
COMMANDS RUN: <list>
RESULT: <pass/fail + key output lines, copied exactly>
PROBLEMS OR QUESTIONS: <list, or "none">
NEXT SUGGESTED STEP: <one sentence>
```
Do not commit unless the task says so. When asked to commit, use a short message like
`feat(engine): add fox movement rule`.
