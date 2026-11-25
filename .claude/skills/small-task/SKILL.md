---
name: small-task
description: The working method for every coding or file change in the Puzzle-Mania / Wild Daily repo — when to act directly versus ask first, how to plan, how to verify, when to commit, and how to report. Use it whenever asked to create, edit, delete, install, build, test, fix or review-and-fix anything.
---

# Working method

Goal: real progress with few interruptions, and nothing the owner would be surprised by.

## 1. Understand
- Read the code you will touch before planning. Check facts in the repo instead of asking.
- Read only the `docs/` sections the task needs.
- If the request is genuinely ambiguous (two reasonable readings that lead to different work),
  ask one focused question. Otherwise pick the sensible default and say which one you picked.

## 2. Decide: act directly, or plan and wait
**Act directly** (no approval step) when the task is clear and stays inside the rules: bug fixes,
tests, refactors within a package, docs, config fixes, small features that follow existing patterns.

**Post a plan and wait for approval** only when the task:
- adds, removes or upgrades a dependency, service or paid cost;
- touches a hard rule or the stack, or needs a product/design decision only the owner can make;
- changes a stored data format (localStorage keys, puzzle file shape, API) in a way that affects players;
- deletes or rewrites anything hard to undo (git history, generated data, the owner's files);
- pushes, deploys, publishes, or contacts any outside service;
- is large: many packages at once, or likely more than ~300 changed lines.

A plan is short and concrete: goal in one line; files to change; how you'll verify; risks or open
choices with your recommendation. Then stop until the owner answers.

For big work, split it into slices that each leave the repo green, and say the slice order up front.
Approval of the overall plan covers the slices; only stop again if something unexpected comes up.

## 3. Do it
- Smallest change that fully solves the problem. Match the surrounding style; never reformat
  untouched code (watch for compact one-line JSON objects and long single-line functions).
- New or changed behaviour gets tests; a bug fix gets a test that fails without the fix.
- If you discover a separate bug, don't silently fix it — note it in the report (or fix it if it's
  tiny, clearly safe, and in a file you are already changing, and say so).
- If reality differs from the plan in a way that matters, stop and explain.

## 4. Verify
Run what the change can affect, and read the output:
- always: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `git status`
- generators / engines: `pnpm gen`
- pages, layout, navigation, styles: `pnpm build`, and `pnpm qa` for anything user-visible
Then run the `code-review` skill on your own diff. Never claim a check passed without running it.

## 5. Commit
When the checks pass, commit the task on the current feature branch (never on `main`/`master`),
one commit per task, Conventional Commit style: `fix(generator): require exactly one Dawn Chorus order`.
Never push, merge, rewrite history, or amend a commit you didn't just make — unless asked.

## 6. Report
Short and plain:
- **Done:** what changed and why, with file links.
- **Checked:** the commands run and their key result lines (copied, not paraphrased).
- **Found:** anything surprising, bugs noticed but not fixed, decisions the owner should make.
- **Next:** one suggested next step.
Skip empty sections. No ceremony beyond that.
