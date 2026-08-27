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

### Flaky test reports

These scripts scan recent GitHub Actions runs, write a JSON report, and print a
ranked summary of the flakiest tests they found.

#### Shared setup

- Install the [GitHub CLI](https://cli.github.com)
- Login with `gh auth login`
- Add `--merge-queue-only` to only scan runs triggered by the merge queue (`merge_group` event).

#### API workflow: `npm run find-flaky-tests-API`

Scans the Jest-based `test_service_api.yml` workflow and reports which
integration tests fail intermittently (flaky) versus consistently (likely
broken).

```shell
npm run find-flaky-tests-API -- \
  --workflow test_service_api.yml \
  --branch main \
  --merge-queue-only \
  --limit 200 \
  --output report-flaky-tests-API.json
```

#### E2E workflow: `npm run find-flaky-tests-E2E`

Same idea, but for the Playwright e2e workflow. Since Playwright already
retries and labels tests as "flaky" itself, this reads every scanned job's log
(not just failed ones, since a flaky test can still leave its job
"successful") and aggregates Playwright's own flaky/failed verdicts. This
workflow only triggers on pull requests and the merge queue (no push-to-main
runs), so `--branch` usually is not useful here.

```shell
npm run find-flaky-tests-E2E -- \
  --workflow test_e2e_portal.yml \
  --merge-queue-only \
  --limit 200 \
  --output report-flaky-tests-E2E.json
```

#### Inspect the JSON reports

Top 10 flaky API tests:

```shell
jq -r '.tests[:10][] | [.failureCount, .totalRunsScanned, .failureRate, .flakinessScore, .testId] | @tsv' report-flaky-tests-API.json | column -t -s $'\t'
```

Top 10 flaky E2E tests:

```shell
jq -r '.flakyTests[:10][] | [.occurrenceCount, .totalRunsScanned, .rate, .testId] | @tsv' report-flaky-tests-E2E.json | column -t -s $'\t'
```

Top 10 consistently failing E2E tests:

```shell
jq -r '.consistentlyFailingTests[:10][] | [.occurrenceCount, .totalRunsScanned, .rate, .testId] | @tsv' report-flaky-tests-E2E.json | column -t -s $'\t'
```
