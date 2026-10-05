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

#### Shared setup

- Install the [GitHub CLI](https://cli.github.com)
- Login with `gh auth login`
- Add `--merge-queue-only` to only scan runs triggered by the merge queue (`merge_group` event).

#### API-tests

Scans failed runs and reports failed API/integration-tests.

```shell
npm run find-failed-tests-API --  --limit 25 --merge-queue-only
```

Top 10:

```shell
jq -r '.tests[:10][] | [.failureCount, .totalRunsScanned, .testId] | @tsv' report-failed-tests-API.json | column -t -s $'\t'
```

#### E2E-tests

Scans failed runs and reports failed E2E-tests.

```shell
npm run find-failed-tests-E2E --  --limit 25 --merge-queue-only
```

Top 10:

```shell
jq -r '.tests[:10][] | [.failureCount, .totalRunsScanned, .testId] | @tsv' report-failed-tests-E2E.json | column -t -s $'\t'
```
