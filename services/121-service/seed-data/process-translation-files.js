#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const _ = require('lodash');

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
 * @param {Object} object Any object
 * @returns {Boolean} Wether it (potentially) contains translatable content
 */
function isTranslatableString(object) {
  if (!object || typeof object !== 'object') {
    return false;
  }
  return object.hasOwnProperty('en') && typeof object['en'] === 'string';
}

/**
 * Deep replace all translatable keys of target locale with "en"-source
 * @param {*} object
 * @param {*} targetLocale
 */
function deepReplaceTranslatableStrings(object, targetLocale) {
  const newObject = _.clone(object);

  _.each(object, (value, key) => {
    if (isTranslatableString(value)) {
      newObject[key] = {
        [targetLocale]: value['en'],
      };
    } else if (typeof value === 'object') {
      newObject[key] = deepReplaceTranslatableStrings(value, targetLocale);
    }
  });

  return newObject;
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
    argv => {
      console.log(`Prepare to update Transifex...`);
      const source = loadFile(argv.in);
      const cleaned = deepReplaceTranslatableStrings(source, 'en');
      const output = formatJSON(cleaned);

      return processOutput(output, argv);
    },
  )
  .command(
    'convert-to-locale',
    'Convert translated file from Transifex into destination locale',
    {
      locale: {
        description: 'Locale to convert to, i.e. "nl" or "nl_BE"',
        demandOption: true,
      },
      merge: {
        description: 'Wether to merge with the existing content of output-file',
        conflicts: 'overwrite',
      },
    },
    argv => {
      console.log(`Converting into: ${argv.locale}`);
      const source = loadFile(argv.in);
      const translatedContent = deepReplaceTranslatableStrings(
        source,
        argv.locale,
      );
      let output = translatedContent;

      if (argv.merge) {
        const mergeInto = loadFile(argv.out);
        const mergedOutput = _.merge(mergeInto, translatedContent);
        output = mergedOutput;
      }

      output = formatJSON(output);

      return processOutput(output, argv);
    },
  )
  .hide('version').argv;
