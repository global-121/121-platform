# 121 Platform (development) Tools

Various development-tools that can be used 'standalone'.

## Getting started

Install dependencies from the repository root with:

```shell
npm install
```

Then run `npm run setup -w tools` to create a baseline for ENV-variables, based on: `.env.example`.

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
