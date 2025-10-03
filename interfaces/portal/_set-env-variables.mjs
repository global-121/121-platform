#!/usr/bin/env node

import { writeFile } from 'node:fs';
import { parseArgs } from 'node:util';

import { shouldBeEnabled } from './_env.utils.mjs';
import configFileTemplate from './src/environments/environment.ts.template.mjs';

let targetEnv = 'production';

// Use command line flag to override default environment
const config = parseArgs({
  options: {
    env: { type: 'string' },
  },
});
if (config.values.env === 'development') {
  targetEnv = 'development';
}

const targetPath = `./src/environments/environment.${targetEnv}.ts`;

writeFile(targetPath, configFileTemplate, (err) => {
  if (shouldBeEnabled(process.env.DEBUG) || shouldBeEnabled(process.env.CI)) {
    console.log(configFileTemplate);
  }

  if (err) {
    console.error(err);
  }

  console.info(`Output generated at: ${targetPath}`);
});
