# Manual Override Log-Out

This folder contains the code for a "manual override" log-out or escape-hatch.
This allows a user to log out of the platform manually, without a functioning Portal-application (due to a bug, out-of-date cache or some other browser-issue).

The user would only have to visit the `/logout`-URL in their browser.

> [!WARNING]
> The [build-action/workflow(s)](../../../../.github/actions/build-interface/action.yml) depend on these files; Make sure to update any references when moving/changing these files.
