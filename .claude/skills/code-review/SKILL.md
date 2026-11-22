---
name: code-review
description: Strict self-review checklist for the Puzzle-Mania / Fresh Snow project. Use it after finishing any code change, before reporting a task as done, and whenever asked to "review", "check" or "double-check" code, a diff or a pull request.
---

# Code review checklist

Review the change as a strict senior engineer. List problems first, then fix only the
real ones (ask before larger fixes).

1. **Spec**: does it match the task and the docs/ section exactly? Anything missing or extra?
2. **Hard rules** in CLAUDE.md: exactly one solution per puzzle, no solutions sent to the
   browser, no invented data, no hard-coded domain, no unapproved dependency.
3. **Tests**: every new function tested? Edge cases: empty input, board edges, time zones
   (midnight, travel), offline, very small and very large boards.
4. **Purity**: engine code has no DOM access and no unseeded randomness.
5. **Accessibility**: keyboard works, labels exist, colour is never the only signal.
6. **Performance**: no large library added; no work repeated on every render.
7. **Files**: only expected files changed (`git status`); nothing written outside the project.

Report: `REVIEW: <n> problems found` then a numbered list (file, line, problem, fix).
