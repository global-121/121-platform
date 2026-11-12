# 121 Platform (development) Tools

Various development-tools that can be used 'standalone'.

## Getting started

Any external dependencies should be installed with:

```shell
npm install
```

## Tools

### `npm run download-logs`

Downloads the latest Docker-logs of any running production-instance from Azure.

#### Dependencies

- Install the [Azure CLI](https://aka.ms/azure-cli)
- Login to Azure with `az login`
- Set the correct ENV-variables in the [`.env`-file](./.env.example)

### `npm run check-versions`

See what version(s) of the platforms' packages are running in production _right now_.  
Similar to the 121 Status-page: <https://status.121.global>, but from the command-line.

### "Failed tests" reports

See recent failed CI-tests, ranked by the number of runs in which they failed.

Both reports use the same script (`find-failed-tests.mjs`), with the flag: `--workflow=<file>`. Supported workflows: `test_service_api.yml` and `test_e2e_portal.yml`.

#### Setup

- Install the [GitHub CLI](https://cli.github.com)
- Login with `gh auth login`
- Add `--merge-queue-only` to only scan runs triggered by the merge queue (`merge_group` event).

#### API-tests

Scan failed runs and reports failed API/integration-tests.

```shell
npm run find-failed-tests:API --  --limit 50 --merge-queue-only
```

Top 10:

```shell
jq -r '.tests[:10][] | [.failureCount, .totalRunsScanned, .testId] | @tsv' report-failed-tests-API.json | column -t -s $'\t'
```

#### E2E-tests

Scan failed runs and reports failed E2E-tests.

```shell
npm run find-failed-tests:E2E --  --limit 50 --merge-queue-only
```

Top 10:

```shell
jq -r '.tests[:10][] | [.failureCount, .totalRunsScanned, .testId] | @tsv' report-failed-tests-E2E.json | column -t -s $'\t'
```

### Build/test energy measurements

The workflows use [Eco CI v5.3.0](https://github.com/green-coding-solutions/eco-ci-energy-estimation/tree/v5.3.0)
to estimate build/test energy and carbon emissions. The measured interval includes
required setup and dependency installation, lint/type/format checks, and Copilot
dependency setup. Deployment workflows measure their build composite action,
including packaging, but not deployment or deployment verification.
Coverage reporting/upload, logs, path filters and check-resolution jobs are not measured.

These workflows are excluded:

- [`upgrade_shared_dependencies.yml`](../.github/workflows/upgrade_shared_dependencies.yml)
- [`deploy_test_all.yml`](../.github/workflows/deploy_test_all.yml)
- [`test_codeql-analysis.yml`](../.github/workflows/test_codeql-analysis.yml)

Each measured job publishes its native Eco CI summary and an artifact named
`eco-ci-<workflow>-<job>[-<shard>]-attempt-<attempt>`. It contains native
`lap-data.json`, native `output.txt` and measurement-status metadata.
Artifacts are retained for 30 days.

The **Build and test energy total** job sums all measured jobs/shards into one
energy total (joules) and one CO2e total (grams). It uses
[`eco-ci-summary.mjs`](./eco-ci-summary.mjs) to sum native lap energy and the
operational, embodied and combined SCI values printed by Eco CI. The headline CO2e
total is the combined SCI value, not that value plus its component emissions.
No custom carbon model or grid-intensity configuration is applied. External
telemetry, badges and PR comments are disabled.

The workflow-total artifact is named
`eco-ci-total-<workflow>-attempt-<attempt>` and contains `total.json`.
Its `complete` field must be `true` for a usable baseline. Skipped work is
reported as `not-run`, not zero. Missing/failed measurements produce an explicit
incomplete summary without changing existing build/test check outcomes. A build
measurement can be complete even if a subsequent deployment fails; check the
workflow conclusion separately.

All existing runners are preserved. For `ubuntu-slim`, the standard GitHub VM
model is deliberately used as an approximation. Actual consumption may differ;
this is not a calibrated measurement or guaranteed upper bound. Native rounding
is inherited when summing values, and runner provisioning, checkout, reporting,
remote Azure processing and ongoing hosting are outside the measured interval.
The added reporting jobs themselves are not measured.

Only artifacts from the same run and current attempt are included. After a
partial rerun, missing current-attempt shards make the total incomplete: use
**Re-run all jobs** to obtain a complete total.

#### One-branch baseline

Publish the instrumented branch and open a **ready-for-review** PR with a valid
Azure DevOps reference and label. Draft PRs skip some tests. Changes to each
workflow file trigger its normal PR checks where supported.

First inspect existing runs, reusing successful measurements for that PR revision:

```shell
BRANCH='your/instrumented-branch'
gh run list --branch "$BRANCH" --limit 50
```

Dispatch workflows that did not run automatically, always against the same
branch. In particular, performance tests and the backend/mock deployment
workflows do not run on normal PR events:

```shell
gh workflow run test_jest_performance_cronjob.yml --ref "$BRANCH"
gh workflow run deploy_test_service.yml --ref "$BRANCH"
```

Inspect the resulting run, wait for it, then dispatch the mock deployment:

```shell
gh run list --branch "$BRANCH" --workflow deploy_test_service.yml --limit 5
gh run watch RUN_ID --exit-status
gh workflow run deploy_test_mock-service.yml --ref "$BRANCH"
```

**Deployment dispatches perform real deployments to the shared `test` environment.**
Check for other active deployments and run deployments serially. Do not invoke
deploy-all or change production/environment protection settings.
If the Portal build has no PR measurement, dispatch
`deploy_test_portal.yml` against the same branch as well; this also deploys.
The PR linter needs a real PR event, not a workflow dispatch.

For each of the 14 in-scope workflows, inspect the run's revision and conclusion,
its energy summary, and its workflow-total artifact:

```shell
gh run view RUN_ID
gh run download RUN_ID --pattern 'eco-ci-total-*' --dir /tmp/eco-ci-baseline-RUN_ID
jq -e '.complete == true' /tmp/eco-ci-baseline-RUN_ID/*/total.json
```

Use the PR's metadata when associating PR merge-ref runs with its head revision;
the merge SHA need not equal the PR head SHA. Verify that API totals include all
six integration shards and the unit job, E2E totals include lint and all six
shards, and performance totals include all seven shards. Do not count
`not-run`, incomplete, stale or failed-workflow results as a complete baseline.
Never fall back to running the default branch if dispatch fails.

#### Testing the aggregation tool

From the repository root, no additional dependencies are needed:

```shell
node --test tools/eco-ci-summary.test.mjs
```
