#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

// EXAMPLES

// node services/121-service/seed-data/process-questions.js process --in /home/ruben/510/121-import-csv/hac-questions.csv

const fs = require('fs');
const _ = require('lodash');
const csv = require('csv-parser');

const drcProgram = 'services/121-service/seed-data/program/program-drc.json';
const drcProgramOut = 'services/121-service/seed-data/program/program-drc.json';

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

function stringToLetterString(input) {
  return input;
  return input.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '-');
}

function getOptions(answerType, row) {
  if (answerType === 'dropdown') {
    const options = [];
    for (const key in row) {
      if (key.includes('Answer options') && row[key]) {
        const optionString = row[key];
        const option = {
          option: stringToLetterString(optionString),
          option: optionString,
          label: {
            en: optionString,
            fr: optionString,
          },
        };
        options.push(option);
      }
    }
    return options;
  } else {
    return null;
  }
}

function rowToQuestion(row) {
  const answerType = row['Question type'].toLowerCase();
  const name = row['Key']
    ? row['Key']
    : stringToLetterString(row['Question text']);
  const question = {
    // name: name,
    name: row['French (original text)'],
    label: {
      en: row['Question text'],
      fr: row['French (original text)'],
    },
    answerType: answerType,
    questionType: 'standard',
    options: getOptions(answerType, row),
    persistence: true,
    export: ['all-people-affected', 'included', 'selected-for-validation'],
    scoring: {},
    phases: [],
    editableInPortal: true,
    shortLabel: {
      en: row['Question text'],
    },
  };
  return question;
}

function formatJSON(object) {
  return JSON.stringify(object, null, '  ');
}

function processOutput(output, destination) {
  console.log(`Written output: ${destination}`);
  fs.writeFileSync(destination, output + '\n');

  console.log('Output:\n\n');
  console.log(output);
}

function storeQuestionsInSeed(csvInput) {
  const jsonQuestions = [];
  for (const row of csvInput) {
    if (row['Import? (Y if yes)'] === 'Y') {
      jsonQuestion = rowToQuestion(row);
      jsonQuestions.push(jsonQuestion);
    }
  }
  const sourceFile = fs.readFileSync(drcProgram);
  const program = JSON.parse(sourceFile);
  program.programQuestions = jsonQuestions;

  const output = formatJSON(program);

  return processOutput(output, drcProgramOut);
}

function processQuestions(filePath) {
  console.log(`Loading: ${filePath}`);

  checkSourceExists(filePath);
  const results = [];

  fs.createReadStream(filePath, { encoding: 'utf8' })
    .pipe(csv({ separator: ';' }))
    .on('data', data => results.push(data))
    .on('end', () => {
      storeQuestionsInSeed(results);
    });
  return;
}

///////////////////////////////////////////////////////////////////////////////

require('yargs')(process.argv.slice(2))
  .usage('Usage: $0 <command> [options]')
  .describe('in', 'File /path to use as input')
  .demandOption('in')
  .command(
    'process',
    'Update program questions based on an excel sheet',
    {},
    argv => {
      console.log(`Prepare to update Transifex...`);
      const source = processQuestions(argv.in);
    },
  )
  .hide('version').argv;
