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

While this naming convention is not strictly enforced, we strongly encourage contributors to follow it to maintain consistency and clarity in the repository.

## Pull Requests

Please submit changes through [pull requests](http://help.github.com/pull-requests/). When sending a PR, follow the pre-populated description template.

## Pull Request Guidelines

- **Draft PRs**: Ignore unless the author explicitly requests attention.
- **Ownership**: Each branch has one owner/maintainer who is also the PR author.
- **Review readiness**:
  - The PR author decides when it's ready for review.
  - "Ready for review" means it's likely to be merged after approval unless stated otherwise.
  - The same reviewer should perform subsequent reviews on a PR they've already reviewed.
- **Reviewers**: Limit to one reviewer unless additional expertise is needed.
- **Merging**:
  - The author merges after approval, though reviewers may merge immediately after approving.
  - If the author doesn't want immediate merging, they must state this in the PR description.
  - PRs must be up-to-date with the target branch before merging, preferably via rebase.
- **Changes during review**:
  - Only the PR author can modify their branch. Reviewers request changes via reviews.
  - Exception: After approval, a reviewer may rebase via GitHub UI if auto-merge is enabled and only a branch update (without conflicts) is pending.
- **PR Lifecycle**:
  - Keep PRs small and merge quickly to minimize maintenance overhead.
  - Prioritize reviewing code over writing new code.
  - Split large changes into smaller, independently mergeable units.
- **PR targeting main**:
  - Include one of the [labels we use for auto-generating release notes](../.github/release.yml)
  - Follow the naming conventions from the [Committing section](#committing):
    - Title with keyword (e.g., `feat: ignore duplicates`)
    - Description with DevOps-item reference
- **PRs targeting non-main branches**:
  - If the target branch is under review, keep the PR in draft until the target branch merges to main.

### Feature Branches

We avoid "feature branches" (long-lived branches with multiple/no owners). For PRs resulting from multiple authors:

- A single person (the PR author) owns the PR and all related changes
- The PR needs review from someone who hasn't contributed to it
- Example: If Bob creates a PR and Jules adds code to it via another PR, someone other than Bob or Jules must review the main PR.

### PR Content Guidelines

- **Avoid mixing responsibilities**:
  - Too broad: Adding a backend endpoint, migrating data, creating frontend code to display it, and adding helper functions.
  - Appropriate scope: Adding a property to an existing entity and displaying it in an existing component.
  - Adding a lint rule plus necessary fixes is acceptable, but adding unrelated features is not.
- **Prefer non-breaking changes**:
  - Example: Add unused backend endpoints or remove frontend elements without removing related endpoints.
  - Separate changes reduce risk and simplify review (though context for both sides is still needed).
- **Separate frontend and backend changes** when possible:
  - Exception: When backend changes break frontend compatibility, include both in one PR.
  - Rule of thumb: If API changes are backward compatible, separate the PRs; if not, combine them.

---

Some useful reading:

- [A guide to mindful communication in code reviews](https://kickstarter.engineering/a-guide-to-mindful-communication-in-code-reviews-48aab5282e5e)
