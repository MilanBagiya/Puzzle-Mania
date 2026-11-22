# Setup and workflow guide

## 1. Install the kit
1. Unzip into D:/Projects/Puzzle-Mania (CLAUDE.md must be in the root, next to docs/).
   If an older CLAUDE.md is there, replace it with this one.
2. Put the 9 exported project docs (Markdown) into docs/.
3. Start a NEW session in your AI tool, opened in D:/Projects/Puzzle-Mania.
4. First message: "Read CLAUDE.md and list the skills you can see." It should list:
   small-task, code-review, fresh-snow-engine, astro-page, animal-guide.
   If it lists none, your tool doesn't load skills automatically: start each task with
   "Read .claude/skills/small-task/SKILL.md first" (and the other skill the task needs).

## 2. FreeLLMAPI settings for coding
Your dashboard (Models page) is set to **Balanced** routing. For coding agents change this:

| Setting | Recommended | Why |
| --- | --- | --- |
| Model filter | Turn on **Tools** | Coding agents need tool calling (read files, run commands); models without it fail or pretend |
| Context filter | **128K+** (1M if available) | Project rules + docs + code need room |
| Routing strategy | **Smartest**, or **Manual** with one strong model on top | Balanced switches models between requests, so a multi-step task can change "brain" halfway and lose track |
| Fallback chain | Create one with 2 to 3 large, tool-capable models | If the first is rate-limited, the next similar model takes over |

Pick models from the table that show the **Tools** badge and a large context (for example,
the top model in your list showed Tools and 1M context). Check the Reliability column too.

Token budget: your dashboard showed about 59M of 135M tokens left this month. Agent sessions
use many tokens, so keep tasks small and start a fresh session for each milestone.

## 3. The loop for every task
1. Get the next task prompt from your reviewer chat (Claude).
2. Paste it into the AI tool. It must reply with a PLAN and wait.
3. Paste the plan to your reviewer if unsure; otherwise reply "OK".
4. The AI does the work and ends with the REPORT block (see small-task skill).
5. Paste the REPORT into your reviewer chat. Get the next task.
6. When a task is approved, commit: `git add -A` then `git commit -m "<message>"`.

## 4. Safety
- Never paste passwords, API keys or AdSense IDs into any AI.
- Free AI services may store prompts; the project plan itself is safe to share.
- If the AI writes outside D:/Projects/Puzzle-Mania or adds packages you didn't approve,
  stop it and report to your reviewer.
