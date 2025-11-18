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
