---
name: code-review
description: Strict review checklist for the Puzzle-Mania / Wild Daily repo. Use it on your own diff before reporting a task done, and whenever asked to review, check or audit code, a diff, a branch or the whole repo.
---

# Code review

Review like a strict senior engineer: find real problems, verify each one, rank by severity.
Prefer evidence (run the code, run a probe, read the caller) over suspicion.

## Checklist
1. **Correctness:** does it do what the task asked, including edge cases — empty input, board edges,
   smallest and largest boards, local midnight, daylight-saving days, players crossing time zones,
   offline, first visit with empty storage, old saved progress?
2. **Hard rules** (see AGENTS.md): uniqueness checked by a solver in tests and the generator;
   no answers in puzzle files; no invented data; no hard-coded domain; no unapproved dependency;
   no ads near the board; performance budget.
3. **Purity:** engine code has no DOM, `Date.now()` or unseeded `Math.random()`.
4. **Tests:** every new or changed exported function is tested; bug fixes have a regression test;
   tests would actually fail if the code were wrong.
5. **Accessibility:** keyboard works, controls have labels, focus is visible, colour is never the only signal,
   reduced motion respected.
6. **Performance:** nothing heavy in the initial bundle; no repeated work per render or per tick.
7. **Scope:** `git status` shows only intended files; no formatting churn; nothing written outside the repo;
   no large binaries or generated output committed.
8. **Checks:** `pnpm lint`, `pnpm typecheck`, `pnpm test` pass (plus `pnpm gen` / `pnpm build` / `pnpm qa`
   when relevant).

## Report
`REVIEW: <n> problems found`, then a numbered list ordered by severity:
file:line, the problem, a concrete failure scenario, and the fix.
Group as **must fix** (bugs, rule breaks), **should fix**, **needs owner decision**.
Also list what was checked and found clean, and any check you could not run (and why).
