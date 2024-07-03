#!/usr/bin/env node

const fs = require('fs');
const dotenv = require('dotenv');

// Load environment-variables from .env file
dotenv.config({
  debug: process.env.DEBUG,
});

let targetEnv = 'production';

// Use command line flag to override default environment
if (process.argv[2] === 'env=development') {
  targetEnv = 'development';
}

const configFileTemplate = require('./src/environments/environment.ts.template.js');
const targetPath = `./src/environments/environment.${targetEnv}.ts`;

fs.writeFile(targetPath, configFileTemplate, (err) => {
  if (process.env.DEBUG || process.env.CI) {
    console.log(configFileTemplate);
  }

  if (err) {
    console.error(err);
  }

  console.info(`Output generated at: ${targetPath}`);
});
