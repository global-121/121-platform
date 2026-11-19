---
name: code-review
description: 'Use when reviewing a 121 Platform pull request, branch diff, or code change. Find actionable defects, regressions, security risks, and missing tests using the repository guidelines.'
user-invocable: false
---

# 121 Platform Code Review

Review changes read-only. Never read `.env` files, disclose secrets, or modify the reviewed changes.

Follow the complete review procedure, sources of truth, checks, and output format in the [guidelines-reviewer agent](../../agents/guidelines-reviewer.agent.md). Do not duplicate its process here; the agent file is the single source of truth.

## Evaluating review-configuration changes

When reviewing changes to these instructions or skills, do not claim they improved review quality based only on their presence or one review. Confirm the configuration is on the pull request's head branch and repository custom instructions are enabled. Check review-comment attributions and linked session logs for skill use. Compare representative Copilot reviews with human findings, preferably against a comparable baseline; record confirmed actionable findings, false positives, and important issues Copilot missed. State limitations when the sample is small or not comparable.
