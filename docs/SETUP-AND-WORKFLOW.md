# Working with AI on this repo

## Setup
1. Open `D:/Projects/Puzzle-Mania` in VS Code with Claude Code (or another agent that reads `AGENTS.md`).
2. The agent reads `CLAUDE.md` → `AGENTS.md` (project rules) and the skills in `.claude/skills/`:
   `small-task` (how to work), `code-review`, `fresh-snow-engine`, `astro-page`, `animal-guide`.
   Tools that don't load skills: start a task with "Read .claude/skills/small-task/SKILL.md first".
3. Use a strong, tool-capable model with a large context. Weak or frequently switching models lose
   track of multi-step tasks and ignore the rules; that is what the old strict plan/OK/report loop
   was compensating for.

## The loop
1. Say what you want in plain words ("fix the sitemap", "add tests for badges", "review the repo").
2. Clear, in-rules tasks are done straight away: change, tests, checks, a commit on the feature branch,
   and a short report.
3. The agent stops and asks first only when the decision is yours: new dependencies or costs,
   hard-rule or stack changes, player-facing data format changes, anything hard to undo,
   pushing/deploying, or very large changes. Answer, and it continues.
4. Big jobs are split into slices that each keep the checks green; you approve the plan once.
5. When a branch is ready, review it (`/code-review`, or ask for a review) and merge it yourself.

## Checks the agent runs
`pnpm lint`, `pnpm typecheck`, `pnpm test` always; `pnpm gen` for engines and generators;
`pnpm build` and `pnpm qa` for pages and anything user-visible.

## Safety
- Never paste passwords, API keys or AdSense IDs into any AI chat.
- The agent only writes inside `D:/Projects/Puzzle-Mania`, never pushes or deploys unless asked,
  and never adds a package without your approval. If it does, stop it and undo with git.
- Large local art tools (`tools/Blender`, `tools/art-sources`) are git-ignored; back them up separately.
