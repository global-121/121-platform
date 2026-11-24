---
name: 121-split
description: >
  Split a large branch/PR into small, reviewable local branches grouped by
  intent, preferably independent PRs to main, otherwise a stack. Use for
  "split this PR", "PR is too big", "make stacked PRs", "break up this branch".
  Never pushes.
---

# 121-split

Turn one oversized branch into small branches that together are identical to the original. The goal is reviewability. Read [grouping heuristics](./references/grouping-heuristics.md) first.

Only use this when the branch really is too big to review. Prefer small PRs that merge to `main` on their own; use a stack only for chunks that truly depend on each other.

## Hard rules

- Every chunk must be mergeable to `main` on its own or after its predecessors: `main` stays releasable, with no broken behaviour and no user-visible half-finished feature.
- Never commit a chunk with an error the original branch does not have (see step 4).
- Never push, force-push, or modify the original branch. The user pushes and opens PRs.
- Never read or modify `.env` files.
- Stop and ask when the working tree is dirty or the diff cannot be split cleanly.
- Never delete or overwrite an existing branch. If a chunk branch name already exists or a step fails halfway, stop, list the branches created so far and ask.
- Do not proceed to execution without explicit user approval of the proposal.

## Steps

### 1. Preflight

Run `scripts/preflight.sh` once and read only its labelled output. Pass the target ref as argument only when the user says the branch will not be merged into `main` (for example, it is itself stacked on another branch). Do not run the underlying git commands separately, and do not interpret raw or empty command output. It does not fetch; do not fetch unless the user agrees. Mention the `target updated` age when it is more than a day old.

- `verdict: READY`: note the `branch`, `sha` and `base` it printed and continue. This `sha` is the original's SHA for the whole run; before verifying, confirm the original branch still points to it and stop if it moved.
- `verdict: BLOCKED`: report exactly the listed blockers and ask only about those. Never ask about a problem the script did not list.
  - dirty working tree or detached HEAD: stop until the user fixes it.
  - after the user rebases or fixes a blocker, re-run the script and continue; do not re-ask settled questions.
  - behind target: the base is stale and chunks may not typecheck. Use `ask_user` with a single question: the user rebases the original branch first and re-runs (preferred; the skill never rewrites the original), or continues on the stale base and expects failures caused by the old base.

### 1b. Baseline checks

Run `scripts/check-touched-packages.sh <base>` on the original branch. It runs what the pre-commit hook runs (typecheck, and eslint on the changed files) and reports the errors that already exist on the original, so they are not mistaken for split failures. Keep this output: it is the baseline for step 4.

- `verdict: CLEAN`: continue; any later chunk failure is caused by the split.
- `verdict: ERRORS_EXIST`: show the listed errors and use `ask_user` once: the user fixes them on the original first (preferred, then re-run from step 1), or continues and accepts them in the chunks that contain those files. "None parsed" means an environment problem (for example missing dependencies), not a code bug; say so. The same holds when most packages fail on unresolved npm packages or `tsconfig.json` options: the installed dependencies are probably out of date, so suggest `npm run install:all` and a re-run before treating them as baseline errors.

### 2. Measure

Run `scripts/measure.sh <base> <original-branch>`. It prints changed lines per file, excluding generated files. Target is ~400 changed lines per chunk. If the total is below the target, say the PR is small enough and stop.

### 3. Analyse and propose (no changes yet)

Read the diff (not only file names) and group files by intent following the heuristics. For each chunk give:

- order number, branch name `<username>/<feature>-<n>-<slug>` (`<username>` is the prefix of the original branch name)
- files and changed line count (excluding generated files)
- one-line rationale and a Conventional Commits PR title (imperative mood)
- whether it typechecks and lints standalone; list files that must be split by hunk
- which baseline errors from step 1b land in this chunk (by file path), e.g. "`foo.spec.ts` error: existing on the original"

First look for chunks that do not depend on other chunks; those are independent and based on `main`. A chunk depends on another when it imports from it, needs it at runtime, or touches the same file (see heuristics). Chain those chunks, ordered so each builds on its predecessors. Prefer file-level splitting; propose hunk-level splitting only when unavoidable.

If a chunk makes part of a feature visible to users, flag it: landing it before the rest risks releasing a half-finished feature. Propose keeping it last in the stack, and ask whether the stack must be merged in full.

Present the proposal as a table, marking each chunk as independent or stacked, and use `ask_user` to approve or adjust it (independent PRs, a stack, or a mix). Only when step 1b reported `ERRORS_EXIST`, ask once in the same form whether chunks that contain those baseline errors may be committed with `--no-verify`; apply that answer to every such chunk instead of asking again mid-run.

### 4. Execute (after approval)

For each chunk in order:

1. `git switch -c <branch>` from the base for an independent chunk, otherwise from the chunk branch it depends on.
2. Bring in the final content: `git checkout <original-branch> -- <paths>` (deleted files: `git rm`; renamed files: `git rm` the old path and check out the new path in the same chunk). For hunk splits, take the diff of the file between the previous chunk and the original, apply only the selected hunks with `git apply --index` (updates both index and working tree).
3. If the chunk changes dependencies in a `package.json`, run `npm ci` in that package so the checks use the right dependencies.
4. Run `scripts/check-touched-packages.sh <base>` and compare it with the baseline from step 1b. Every error must also be in the baseline (typecheck: same file and error; lint: same file). Any other error is caused by the split: fix it by moving files or hunks between chunks, and go back to `ask_user` when that changes the approved proposal. Never commit it and never work around it.
5. Commit with a Conventional Commits message, a `Co-authored-by` trailer for every author of the original commits other than the committer (`git log --format='%an <%ae>' <base>..<original-branch>`), and this trailer:
   `Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`
   Use `--no-verify` only when the user allowed it in step 3 and the check in the previous step showed baseline errors and nothing else.

Generated files (see heuristics) go with the chunk that causes them. Regenerate them rather than hand-editing when a chunk contains only part of the change.

### 5. Verify

- Stack: `scripts/verify-stack.sh <original-branch> <last-branch>` must report no tree difference.
- Independent chunks: no single branch contains everything, so verify against a temporary branch that merges all independent chunk branches and stack tips, and delete that temporary branch afterwards. A merge conflict means two chunks are not independent: stop and propose stacking them.
- On a mismatch, stop and show the differing files. Decide per file with the user whether it was forgotten (add it to the chunk it belongs to) or has wrong content (redo that chunk). Never add the difference to the last chunk just to make the trees equal.
- The original branch must be unchanged (same SHA as at the start).
- Finish with `git switch <original-branch>`, so the user is back where they started. If step 4 ran `npm ci` in a package, run it there once more.

### 6. Report

Return the stack in order with branch names and line counts, then the manual commands for the user:

```bash
git push -u origin <branch>   # for each branch, in order
```

PR base is `main` for independent chunks, and the branch it depends on for stacked chunks. Stacked PRs must be merged in order; if the stack was marked "merge in full", remind the user not to merge any user-visible chunk before the whole stack is approved. Remind the user that each PR description needs the `AB#` reference and a label (enhancement, bugfix, other, chore), and to use draft status until ready.

Also tell the user what comes after:

- The checks cover typecheck and lint only. Tests did not run per chunk; CI on each PR is the gate for those.
- Review fixes on a stacked chunk must be merged or rebased into every branch stacked on top of it.
- After a stacked PR is merged, rebase the next branch onto `main` before merging it (`git rebase --onto origin/main <merged-branch> <next-branch>`).
- The original PR, if one exists, should be closed with links to the new PRs; keep the original branch until all chunks are merged.
