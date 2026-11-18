---
name: 121-split
description: >
  Split a large branch/PR into small, reviewable, stacked local branches grouped
  by intent. Use for "split this PR", "PR is too big", "make stacked PRs",
  "break up this branch". Never pushes.
---

# 121-split

Turn one oversized branch into a stack of small branches that together are identical to the original. Read [grouping heuristics](./references/grouping-heuristics.md) first.

## Hard rules

- Never push, force-push, or modify the original branch. The user pushes and opens PRs.
- Never read or modify `.env` files.
- Stop and ask when the working tree is dirty or the diff cannot be split cleanly.
- Do not proceed to execution without explicit user approval of the proposal.

## Steps

### 1. Preflight

- `git status --porcelain` must be empty. Otherwise stop.
- Note the original branch: `git branch --show-current`, and its SHA. Base is `git merge-base origin/main HEAD`. Do not fetch unless the user agrees; otherwise use the local ref.

### 2. Measure

Run `scripts/measure.sh <base> <original-branch>`. It prints changed lines per file, excluding generated files. Target is ~400 changed lines per chunk. If the total is below the target, say the PR is small enough and stop.

### 3. Analyse and propose (no changes yet)

Read the diff (not only file names) and group files by intent following the heuristics. For each chunk give:

- order number, branch name `<username>/<feature>-<n>-<slug>`
- files and changed line count (excluding generated files)
- one-line rationale and a Conventional Commits PR title (imperative mood)
- whether it typechecks and lints standalone; list files that must be split by hunk

Chunks should be ordered so each builds on the previous. Prefer file-level splitting; propose hunk-level splitting only when unavoidable. Present the proposal as a table and use `ask_user` to approve or adjust it.

### 4. Execute (after approval)

For each chunk in order:

1. `git switch -c <branch>` from the previous chunk branch (the first from the base).
2. Bring in the final content: `git checkout <original-branch> -- <paths>` (deleted files: `git rm`). For hunk splits, take the diff of the file between the previous chunk and the original, apply only the selected hunks with `git apply --cached`, then check the result compiles.
3. Commit with a Conventional Commits message and this trailer:
   `Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`

Generated files (see heuristics) go with the chunk that causes them. Regenerate them rather than hand-editing when a chunk contains only part of the change.

### 5. Verify

- `scripts/verify-stack.sh <original-branch> <last-branch>` must report no tree difference. If it does, put the leftover files in the last chunk.
- The original branch must be unchanged (same SHA as at the start).
- Per chunk, best effort: `npm run typecheck` and `npm run lint` in the touched package(s) (`services/121-service`, `interfaces/portal`). Report failures; do not skip them silently.

### 6. Report

Return the stack in order with branch names and line counts, then the manual commands for the user:

```bash
git push -u origin <branch>   # for each branch, in order
```

PR base for chunk N is the branch of chunk N-1 (first chunk: `main`). Remind the user that each PR description needs the `AB#` reference and a label (enhancement, bugfix, other, chore), and to use draft status until ready.
