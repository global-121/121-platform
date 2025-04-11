# How to contribute

Thanks for helping out!

## Committing

We try to follow the "[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)" convention, combined with the "[Angular Commit Message format](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#-commit-message-format)".

When committing your changes, provide a commit message(-subject) that starts with an appropriate keyword:

- `feat`: new feature for the user
- `fix`: bug fix for the user
- `docs`: changes to the documentation
- `style`: formatting, missing semi colons, etc; no production code change
- `refactor`: refactoring production code, eg. renaming a variable
- `test`: adding missing tests, refactoring tests; no production code change
- `chore`: cleanups, version updates etc; no production code change

Let the message be an _*imperative*_ description of the changes. (Don't tell what _you did_, but what this commit will **do** when applied to the code.)  
So in your head, finish the sentence: "**This commit will... `<verb> <subject> ...`**".

Some examples:

- `feat:` (This commit will) `Add info-button to Profile-page header`
- `docs:` (This commit will) `Remove confusing/inconsistent terms from helper-functions examples`
- `refactor:` (This commit will) `Load the program-list fast again`
- `fix:` (This commit will) `Prevent the user from submitting an empty form`

Also add an Azure DevOps task-ID in the body(after the first line) of the commit message. This will make it a clickable link on GitHub. A mention in the title only gives a one-way link from DevOps to GitHub, not vice-versa.

For example:

```txt
feat: Add transaction-history to the profile page

See AB#123456
```

Some additional reading:

- [Commit Often, Perfect Later, Publish Once: Git Best Practices](https://sethrobertson.github.io/GitBestPractices/)

## Branches

We use the convention of using `username/branch-description` to name our branches. This helps reinforce the paradigm outlined in [Submitting changes](#submitting-changes) that one branch has one author.

As an example, a branch created by the user `aberonni` that introduces the new feature of ignoring duplicates might be called: `aberonni/ignore-duplicates`.

This is a guideline, but branch names are not really significant in any way to our process.

## Pull Requests

Please submit changes through [pull requests](http://help.github.com/pull-requests/). When you send a pull request, the description will be pre-populated with a sample description. Please adhere to it as much as possible.

Below is a list of other guidelines we try to follow for PRs.

- Draft PRs should be ignored by other developers (unless explicitly stated by the PR author).
- Branches should be owned and maintained by one person, and as such a PR always has one owner/author/maintainer
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
- PRs should have "the shortest life possible" and therefore be merged to `main` as quickly as possible, to avoid the overhead of maintenance. As a consequence:
  - We make PRs as small as possible
  - We prioritize reviewing code over writing new code
  - We try to split larger changes/PRs into smaller chunks/refactors that can be merged independently
  - We try to avoid mixing frontend & backend changes in one PR, whenever possible.
    - For example, if the backend adds a new endpoint, then the frontend code that uses that new endpoint should be added in a separate PR towards `main`, that is reviewed once the endpoint itself has already been merged to `main`. This is opposed to the approach of creating a feature branch that contains both the backend and the frontend code for this new feature.
    - As an example of when this is unavoidable: when the backend changes an existing endpoint in a way that breaks the frontend, then the adjustment in the frontend needs included in the same PR.
- We avoid "feature branches". PRs towards `main` that are a result of different authors are still possible, but
  - We do not call them feature branches
  - They are still owned by a single person, and that person is the PR author
  - The PR author is expected to own all changes and change requests on that PR
  - That PR towards `main` still needs a full review from someone who has not seen the code before being merged to `main`
    - For example, if Bob creates a PR towards `main`, and then Jules adds code to that PR via another PR, then someone who isn't Bob nor Jules should review the original PR towards `main`
- For PRs towards `main`
  - Every PR should have one of the [labels we use for auto-generating release notes](../.github/release.yml)
  - Every PR title and description should follow the naming conventions outlined in the [Committing section](#committing) above. For example:
    - A descriptive title that starts with a keyword, eg. `feat: ignore duplicates`
    - The description should contain a reference to a devops item
- For PRs that target a branch that isn't `main`
  - If the target branch is currently in review, then the PR in question stays in draft (and therefore is not merged/reviewed) until the target branch is merged into `main`
    - This avoids the much dreaded long-lived and difficult-to-review feature branch phenomenon

Some useful reading:

- [A guide to mindful communication in code reviews](https://kickstarter.engineering/a-guide-to-mindful-communication-in-code-reviews-48aab5282e5e)
