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

### `npm run upgrade-sheetjs`

To upgrade the version of SheetJS we use for use in all components of the 121 Platform.

#### Usage

Set the desired version in the `SHEETJS_VERSION`-variable and run:

```shell
SHEETJS_VERSION=0.20.4 npm run upgrade-sheetjs
```

#### Versions

SheetJS latest version: [![SheetJS latest version](https://img.shields.io/badge/dynamic/xml?url=https%3A%2f%2fgit.sheetjs.com%2fsheetjs%2fsheetjs%2ftags.rss&query=.%2f%2fchannel%2fitem%5B1%5D%2ftitle&label=SheetJS+latest&color=lightgreen)](https://git.sheetjs.com/sheetjs/sheetjs/tags)

SheetJS version used in:

- [![SheetJS used in: 121-service](https://img.shields.io/github/package-json/dependency-version/global-121/121-platform/xlsx/main?filename=services%2F121-service%2Fpackage.json&label=SheetJS+in+121-Service)](https://github.com/global-121/121-platform/blob/main/services/121-service/package.json)
- [![SheetJS used in: Portal](https://img.shields.io/github/package-json/dependency-version/global-121/121-platform/xlsx/main?filename=interfaces%2Fportal%2Fpackage.json&label=SheetJS+in+Portal)](https://github.com/global-121/121-platform/blob/main/interfaces/portal/package.json)
- [![SheetJS used in: E2E-tests](https://img.shields.io/github/package-json/dependency-version/global-121/121-platform/xlsx/main?filename=e2e%2Fpackage.json&label=SheetJS+in+E2E-tests)](https://github.com/global-121/121-platform/blob/main/e2e/package.json)
