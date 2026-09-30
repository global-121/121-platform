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

These scripts scan recent failed GitHub Actions runs, write a JSON report, and print a summary of failed tests ranked by the number of runs in which they failed.
Only failed test-shard jobs are read; runs skipped by path filters are excluded.

#### Shared setup

- Install the [GitHub CLI](https://cli.github.com)
- Login with `gh auth login`
- Add `--merge-queue-only` to only scan runs triggered by the merge queue (`merge_group` event).

#### API workflow: `npm run find-failed-tests-API`

Scans failed runs of the Jest-based `test_service_api.yml` workflow and reports failed integration tests.

```shell
npm run find-failed-tests-API -- \
  --workflow test_service_api.yml \
  --branch main \
  --merge-queue-only \
  --limit 200 \
  --output report-failed-tests-API.json
```

#### E2E workflow: `npm run find-failed-tests-E2E`

Scans failed runs of the Playwright e2e workflow and aggregates tests marked "failed" in failed shard-job logs (after any retries). This workflow only triggers on pull requests and the merge queue (no push-to-main runs), so `--branch` usually is not useful here.

```shell
npm run find-failed-tests-E2E -- \
  --workflow test_e2e_portal.yml \
  --merge-queue-only \
  --limit 200 \
  --output report-failed-tests-E2E.json
```

#### Inspect the JSON reports

Top 10 failed API tests:

```shell
jq -r '.tests[:10][] | [.failureCount, .totalRunsScanned, .testId] | @tsv' report-failed-tests-API.json | column -t -s $'\t'
```

Top 10 failed E2E tests:

```shell
jq -r '.tests[:10][] | [.failureCount, .totalRunsScanned, .testId] | @tsv' report-failed-tests-E2E.json | column -t -s $'\t'
```
