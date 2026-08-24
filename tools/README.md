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

### `npm run find-flaky-integration-tests`

Scans recent GitHub Actions runs of the Jest-based `test_service_api.yml`
workflow and reports which integration tests fail intermittently (flaky)
versus consistently (likely broken). Writes a JSON report and prints a ranked
summary.

#### Dependencies

- Install the [GitHub CLI](https://cli.github.com)
- Login with `gh auth login`

#### Options

```shell
npm run find-flaky-integration-tests -- \
  --workflow test_service_api.yml \
  --branch main \
  --limit 200 \
  --output flaky-integration-report.json
```

### `npm run find-flaky-playwright-tests`

Same idea as `find-flaky-tests`, but for the Playwright e2e workflow. Since
Playwright already retries and labels tests as "flaky" itself, this reads every
scanned job's log (not just failed ones, since a flaky test can still leave its
job "successful") and aggregates Playwright's own flaky/failed verdicts. Note
this workflow only triggers on pull requests and the merge queue (no push-to-main
runs), so `--branch` isn't useful here.

#### Dependencies

- Install the [GitHub CLI](https://cli.github.com)
- Login with `gh auth login`

#### Options

```shell
npm run find-flaky-playwright-tests -- \
  --workflow test_e2e_portal.yml \
  --limit 200 \
  --output flaky-playwright-report.json
```
