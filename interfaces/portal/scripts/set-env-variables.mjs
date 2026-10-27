import { writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

import configFileTemplate from '../src/environments/environment.ts.template.mjs';
import { shouldBeEnabled } from './lib/env.utils.mjs';

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

try {
  writeFileSync(targetPath, configFileTemplate);
} catch (err) {
  console.error(err);
  process.exit(1);
}

if (shouldBeEnabled(process.env.DEBUG) || shouldBeEnabled(process.env.CI)) {
  console.log(configFileTemplate);
}

console.info(`Output generated at: ${targetPath}`);
