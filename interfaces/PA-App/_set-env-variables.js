#!/usr/bin/env node

const fs = require('fs');
const dotenv = require('dotenv');

// Load environment-variables from .env file
dotenv.config({
  debug: process.env.DEBUG,
});

const configFileTemplate = require('./src/environments/environment.prod.ts.template.js');
const targetPath = './src/environments/environment.prod.ts';

fs.writeFile(targetPath, configFileTemplate, (err) => {
  if (process.env.DEBUG) {
    console.log(configFileTemplate);
  }

  if (err) {
    console.error(err);
  }

  console.info(`Output generated at: ${targetPath}`);
});
