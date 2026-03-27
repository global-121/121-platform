# Shared ESLint Configuration for the 121 Platform

This package provides a shared ESLint configuration for all other parts/packages in this mono-repo.
It includes a baseline configuration, as well as recommended rules for both JavaScript- and TypeScript-files.

## Usage

See the other packages' `eslint.config.mjs` files for examples on how to use and extend from this shared configuration.

## Development

### Getting started

Make sure to install the dependencies of this package by running: `npm install`

### Changing rules and options

To make changes to this shared configuration (adding/removing rules, changing options etc.) you can edit the configuration file `index.mjs` in this folder; It will be automatically used by all other packages that extend from it.

## Adding/removing plugins and dependencies

When making changes that involve changes to the installed (dev-)dependencies, please make sure to not only update 'its own' `package(-lock).json` file, but **_ALSO_** update the `package(-lock).json` files of all other packages that depend on it.

To do so, run `npm run install:local:all` from the root of this repository. And commit all changes to the `package(-lock).json` files in the same PR.

### Code style and linting

The code inside this folder also follows its [own lint-configuration.](./eslint.config.mjs)  
So make sure too run `npm run lint` (or `npm run fix`) in this folder to check/fix linting errors when making changes to the code.
