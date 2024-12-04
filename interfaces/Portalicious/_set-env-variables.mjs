#!/usr/bin/env node

import { writeFile } from 'fs';
import configFileTemplate from './src/environments/environment.ts.template.mjs';

let targetEnv = 'production';

// Use command line flag to override default environment
if (process.argv[2] === 'env=development') {
  targetEnv = 'development';
}

const targetPath = `./src/environments/environment.${targetEnv}.ts`;

writeFile(targetPath, configFileTemplate, (err) => {
  if (process.env.DEBUG || process.env.CI) {
    console.log(configFileTemplate);
  }

  if (err) {
    console.error(err);
  }

  console.info(`Output generated at: ${targetPath}`);
});
