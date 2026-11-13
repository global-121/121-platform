---
name: code-review
description: 'Use when reviewing a 121 Platform pull request, branch diff, or code change. Find actionable defects, regressions, security risks, and missing tests using the repository guidelines.'
user-invocable: false
---

# 121 Platform Code Review

Review changes read-only. Never read `.env` files, disclose secrets, or modify the reviewed changes.

## Review scope

- Report only actionable issues introduced by the changes. Do not report pre-existing problems, speculative concerns, or personal preferences that are not in the repository guidelines.
- Prioritize incorrect behavior, regressions, security or data-loss risks, and missing tests.
- Always report violations of the repository guidelines (including naming, structure, and conventions) as **should fix**, citing the guideline section.
- Read relevant surrounding code before reporting a finding.

## Sources of truth

Read the root [AGENTS.md](../../../AGENTS.md) and applicable path-specific instructions in `../../instructions/`. Read the full canonical guidance relevant to the changed files:

- Backend or mock service: [Software Architecture Guidelines](../../../docs/guidelines/software-architecture.md).
- Portal: [Portal Development Guidelines](../../../docs/guidelines/portal-development.md).
- Tests: Software Architecture Guidelines section L and [Which tests to automate](../../../docs/guidelines/which-tests-to-automate.md).
- Commits or pull request metadata: [Pull request template](../../../docs/pull_request_template.md) and applicable AGENTS.md version-control rules.

## Review procedure

1. For a pull request, review its diff against the base branch (default `main`). For local reviews, include staged, unstaged, and non-`.env` untracked changes. Never include `.env` paths or contents in findings.
2. Check changed behavior against the applicable sources of truth and nearby implementation. Report only issues introduced by the change.
3. Check changed code for import cycles and shared runtime constants or helpers exported from framework implementation files. Shared items belong in nearby dedicated files; do not flag the primary implementation export or public service methods.
4. For changed tests, check coverage for new behavior and branches, and check that no focused-only tests or error suppressions were introduced.
5. When a pull request changes `docs/guidelines/*`, verify the matching `.github/instructions/` summary and `AGENTS.md` remain consistent. Report only concrete drift.
6. Run focused, safe checks when the relevant dependencies and tools are already available. For affected subprojects, run their lint and typecheck commands. For files outside those subprojects, run the root Prettier check when available. Do not install dependencies, start services, or access secrets just to run a review. State which checks passed, failed, or could not be run; a skipped check is not a pass.

## Findings and output

- Report findings first, ordered by severity. Use only **blocker** or **should fix**; do not add nits for preferences outside the guidelines.
- Each finding must identify the file and line, describe a concrete failure scenario, cite the violated guideline when applicable, and suggest a practical fix.
- If there are no findings, say so explicitly and note meaningful verification gaps.
- Then provide a one- or two-sentence summary, checks run and any gaps, and an assessment of exactly one of **Approve**, **Approve with fixes**, or **Block**.
- The assessment is a recommendation in the review text. It does not determine the formal GitHub review event or replace required human approval.

## Evaluating review-configuration changes

When reviewing changes to these instructions or skills, do not claim they improved review quality based only on their presence or one review. Confirm the configuration is on the pull request's head branch and repository custom instructions are enabled. Check review-comment attributions and linked session logs for skill use. Compare representative Copilot reviews with human findings, preferably against a comparable baseline; record confirmed actionable findings, false positives, and important issues Copilot missed. Do not use comment count alone as a quality measure. Review results over one or two sprints and state limitations when the sample is small or not comparable.
