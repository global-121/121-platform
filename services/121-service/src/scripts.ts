import { NestFactory } from '@nestjs/core';
import { ScriptsModule, InterfaceScript } from './scripts/scripts.module';
import yargs = require('yargs');
import { EventEmitter } from 'events';

async function runScript(scriptName): Promise<any> {
  const context = await NestFactory.createApplicationContext(ScriptsModule);
  const { default: Module } = await import(
    `${__dirname}/scripts/${scriptName}.ts`
  );
  if (typeof Module !== 'function') {
    throw new TypeError(
      `Cannot find default Module in scripts/${scriptName}.ts`,
    );
  }
  const script = context.get<InterfaceScript>(Module);
  if (!script) {
    throw new TypeError(`Cannot create instance of ${Module.scriptName}`);
  }
  await script.run(yargs.argv);
}

function confirmRun(scriptName): any {
  const prompt = new EventEmitter();
  let current = null;
  let result = null;
  process.stdin.resume();

  process.stdin.on('data', function(data) {
    prompt.emit(current, data.toString().trim());
  });

  prompt.on(':new', function(name, question) {
    current = name;
    console.log(question);
    process.stdout.write('> ');
  });

  prompt.on(':end', function() {
    process.stdin.pause();
    if (result !== 'y') {
      console.log('Operation aborted.');
      process.exit();
      return;
    } else {
      runScript(scriptName);
    }
  });

  prompt.emit(
    ':new',
    'confirm',
    'Are you sure? This might delete existing data in the database. (y/n)',
  );

  prompt.on('confirm', function(data) {
    result = data;
    prompt.emit(':end');
  });
}

async function main(): Promise<void> {
  try {
    const names: string[] = yargs.argv._;
    const name = names[0];

    if (name === 'seed-prod') {
      runScript(name);
    } else {
      confirmRun(name);
    }
  } catch (error) {
    throw error;
  }
}

main();
