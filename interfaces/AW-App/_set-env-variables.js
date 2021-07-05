const fs = require('fs');
const dotenv = require('dotenv');

// Load environment-variables from .env file (if available)
dotenv.config();

const configFileTemplate = require('./src/environments/environment.prod.ts.template.js');
const targetPath = './src/environments/environment.prod.ts';

fs.writeFile(targetPath, configFileTemplate, (err) => {
  if (err) {
    console.log(err);
  }

  console.log(`Output generated at ${targetPath}`);
});
