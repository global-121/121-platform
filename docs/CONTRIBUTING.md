# How to contribute

Thanks for helping out!

## Committing

We try to follow the "[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)" convention, combined with the "[Angular Commit Message format](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#-commit-message-format)".

When committing your changes, provide a commit message that starts with an appropriate keyword:

- `feat`: new feature for the user
- `fix`: bug fix for the user
- `docs`: changes to the documentation
- `style`: formatting, missing semi colons, etc; no production code change
- `refactor`: refactoring production code, eg. renaming a variable
- `test`: adding missing tests, refactoring tests; no production code change
- `chore`: cleanups, version updates etc; no production code change

Add an Azure DevOps task ID at the end of the commit message.  
For example: "`feat: new feature added to the profile page AB#123456`".

### Updating dependencies

Most (development-)dependencies in this repository are monitored by the GitHub [Dependabot](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/about-dependabot-version-updates) service, to keep them up-to-date.
The configuration of these updates is in [`.github/dependabot.yml`](../.github/dependabot.yml).  
Unfortunately most individual dependencies are 'linked' to related dependencies that need to stay 'in sync'.

> [!NOTE]  
> `Sheetjs` is not monitored by Dependabot. Check the latest version of `Sheetjs`: [![`Sheetjs` latest version](https://img.shields.io/badge/dynamic/xml?url=https%3A%2f%2fgit.sheetjs.com%2fsheetjs%2fsheetjs%2ftags.rss&query=.%2f%2fchannel%2fitem%5B1%5D%2ftitle&logo=microsoftexcel&logoColor=white&label=sheetjs&color=lightgreen)](https://git.sheetjs.com/sheetjs/sheetjs/tags)

Interface dependencies:

To update all Angular and ESLint related dependencies together, run (in each individual interface's directory):

    npm run upgrade:angular

All related changes will be handled by the Angular CLI, but need to be checked afterwards with `lint`, `test` commands and local testing.

## Submitting changes

Please submit changes through [pull requests](http://help.github.com/pull-requests/). When you send a pull request, the description will be pre-populated with a sample description. Please adhere to it as much as possible.

Below is a list of other guidelines we try to follow for PRs.

- Draft PRs should be ignored by other developers (unless explicitly stated by the PR author).
- The PR author decides when a PR is ready for review.
  - Marking a PR as “ready for review” implies that it can (most likely will) be merged after an approval (unless explicitly stated otherwise by the PR author in the PR description).
  - When there has already been one review/reviewer on a PR, then that same reviewer will by default be expected to perform subsequent reviews on the same PR.
- PRs should have only one reviewer unless extra reviewer(s) are explicitly requested by a PR author or reviewer (i.e., When a reviewer or author does not feel confident about a set of changes).
- The PR author merges the PR into the target branch once the PR has been approved, but the reviewer can also decide to merge it immediately after an approval.
  - If the author wishes for the PR not to be merged after review, this must be explicitly stated in the PR description.
- PRs must be up-to-date with their target branch before being merged. Preferably, through the means of a rebase. (Currently not enforced but soon to become the default).
- Only the PR author can make changes to their PR/branch. If a reviewer wants changes to be made, they request changes via a review.
  - As an exception to this rule, a reviewer who has just approved a PR can decide to rebase the branch via the GitHub UI if
    - the author has enabled auto-merge and
    - a branch update (without conflicts) is the only thing stopping the auto-merge
- For substantial changes, we prefer creating a "parent/feature" PR which receives multiple smaller PRs. For the parent PR and all the smaller child PRs, all the general guidelines apply.

Some useful reading:

- [A guide to mindful communication in code reviews](https://kickstarter.engineering/a-guide-to-mindful-communication-in-code-reviews-48aab5282e5e)
