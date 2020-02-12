import { NestFactory, Reflector } from '@nestjs/core';
import { ScriptsModule, InterfaceScript } from './scripts/scripts.module';
import yargs = require('yargs');

function confirmRun(scriptName): any {
  var EventEmitter = require('events');
  var prompt = new EventEmitter();
  var current = null;
  var result = null;
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
    'Are you sure? This will delete existing data in the database. (y/n)',
  );

  prompt.on('confirm', function(data) {
    result = data;
    prompt.emit(':end');
  });
}

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

async function main(): Promise<void> {
  try {
    const names: string[] = yargs.argv._;
    const name = [names];
    const name_check = name[0][0];

    if (
      name_check !== 'seed-prod' &&
      name_check !== 'seed-publish' &&
      process.env.NODE_ENV === 'production'
    ) {
      console.log(
        '-----------NOTE: You are in production-environment and cannot run this script.----------------',
      );
      return;
    }

    if (name_check !== 'seed-prod' && name_check !== 'seed-publish') {
      confirmRun(name);
    } else {
      runScript(name);
    }
  } catch (error) {
    throw error;
  }
}

main();
