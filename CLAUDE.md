# Memory
- Before starting work, read `C:\Users\danim\Documents\Second Brain\Memory\Claude.md` (the main memory note).
- Before stopping, update it: decisions, open items, and a one-line session log entry.

# Project
- Spec: `PRD_1.md` (Sabung Idol PRD). Build phase by phase per §15; never start the next phase before its gate passes and the user approves.

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
