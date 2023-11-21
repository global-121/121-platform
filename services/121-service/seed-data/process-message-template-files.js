#!/usr/bin/env node

// EXAMPLES

// Prepare file for transifex
// node services/121-service/seed-data/process-message-template-files.js prepare-to-update-transifex --in services/121-service/seed-data/program/program-pilot-nl-2.json --out ./program-pilot-nl-2.json
const fs = require('fs');
// const _ = require('lodash');

/**
 * Perform check(s) on source paths/files before proceeding...
 * @param {String} path
 * @returns {String} Path to existing source-files
 */
function checkSourceExists(path) {
  if (!fs.existsSync(path)) {
    console.warn(`File at ${path} does not exist!`);
    return process.exit(1);
  }

  if (!path.includes('message-template')) {
    console.warn(
      `This script should be used to convert message-template files only!`,
    );
    return process.exit(1);
  }

  return path;
}

/**
 * @param {String} filePath
 * @returns {Object}
 */
function loadFile(filePath) {
  console.log(`Loading: ${filePath}`);

  checkSourceExists(filePath);

  const sourceFile = fs.readFileSync(filePath);
  return JSON.parse(sourceFile);
}

/**
 * Deep replace all translatable keys of target locale with "en"-source
 * @param {*} object
 * @param {*} targetLocale
 */
function createObjectForTransifex(object, targetLocale) {
  let transifexObject = {};
  let skipped = [];
  for (const key of Object.keys(object)) {
    if (!object[key] || !object[key]['message'][targetLocale]) {
      skipped.push(key);
      continue;
    }

    transifexObject = {
      ...transifexObject,
      [key]: object[key]['message'][targetLocale],
    };
  }

  return { transifexObject, skipped };
}

function formatJSON(object) {
  return JSON.stringify(object, null, '  ');
}

function processOutput(output, argv) {
  let destination;

  if (argv.out) {
    destination = argv.out;
  } else if (argv.overwrite) {
    destination = argv.in;
  }

  if (destination) {
    console.log(`Written output: ${destination}`);
    return fs.writeFileSync(destination, output + '\n');
  }

  console.log('Output:\n\n');
  console.log(output);
}

///////////////////////////////////////////////////////////////////////////////

require('yargs')(process.argv.slice(2))
  .usage('Usage: $0 <command> [options]')
  .describe('in', 'File /path to use as input')
  .demandOption('in')
  .describe('out', 'File/path to write output to')
  .describe('overwrite', 'Use input-file as output')
  .command(
    'prepare-to-update-transifex',
    'Create a file ready to import/update into Transifex',
    {},
    (argv) => {
      console.log(`Prepare to update Transifex...`);
      const source = loadFile(argv.in);
      const { transifexObject, skipped } = createObjectForTransifex(
        source,
        'en',
      );
      // const cleaned = createObjectForTransifex(source, 'en')['transifexObject'];
      const output = formatJSON(transifexObject);
      if (skipped.length) {
        console.warn('These keys did not have a translatable string:');
        console.warn(skipped.join(', '));
      }

      return processOutput(output, argv);
    },
  )
  .hide('version').argv;
