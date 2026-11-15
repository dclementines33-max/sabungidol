# Memory
- Start every session by reading `docs/PROGRESS.md`: status, the next step, a map of where every part
  of the code lives, and the rules that are easy to break. Don't read the code file by file; open a file
  only when the task touches it.
- Then read `C:\Users\danim\Documents\Second Brain\Memory\Claude.md` (the main memory note) for the
  running log and the user's decisions.
- Before stopping (and after every finished step), update both: `docs/PROGRESS.md` (status, map, new
  rules) and the memory note (decisions, open items, a one-line session log entry).

# Project
- Spec: `PRD_1.md` (Sabung Idol PRD). Build phase by phase per Â§15; never start the next phase before its gate passes and the user approves.
- UI references: pictures in `design/refs/`, explained in `design/NOTES.md`. Read both before building or changing any page or component the user sees; a reference says what a page shows, while colours and sizes come from `packages/ui/src/tokens.css`.

# Project rules

## Organization
Keep this app organized so a beginner can read it.
- Screens go in `pages/`.
- Shared pieces go in `components/`.
- Saving and loading goes in `data/`.
- One job per file.
- No file over 300 lines.
- Before writing anything new, check if it already exists.

# Coding rules

## Minimal code
- Write the least code that solves the task. No extra abstractions, helpers,
  config options, or "future-proofing" that was not asked for.
- Before finishing, check: can this be shorter? If 200 lines can be 50, write
  50. If a rewrite of the function is cleaner than patching it, rewrite it.

## Ask, don't guess
- If requirements, edge cases, or intent are unclear, stop and ask. Ask before
  writing code, not after. Do not fill gaps with assumptions.
- If there are several valid approaches, list them in 2-3 lines and ask.

## Surgical changes
- Touch only the code needed for the task. Do not reformat, rename, reorder
  imports, or refactor unrelated code.
- Simplify only inside the code you are already changing.
- Mention unrelated problems you notice, but do not fix them.

## Test every change
- After each change, run the relevant tests. Do not batch many changes
  before testing.
- If no test covers the change, add a small one first, or tell me why not.
- Report the actual test result. Never say "should work".

# Update workflow (two sessions)
- When the user describes an app update, the receiving session acts as router: split it into tasks, label each light or heavy
  (criteria in `docs/PROGRESS.md` â†’ "Two-session workflow"), and send each as a brief (goal, files, done = what) with SendMessage:
  light â†’ "Sonnet lighter task" (`local_bae9947b-6cf5-4542-8513-c8a152412a20`), heavy â†’ "Opus Hard Task" (`local_ccbd1d15-6161-4700-8127-82730a97a786`).
- Tell the user in one line which task went where. If an id is gone, find it with list_sessions by title. Never send both sessions edits to the same files at once.
