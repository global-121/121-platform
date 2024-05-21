import {
  InterfaceScript,
  ScriptsModule,
} from '@121-service/src/scripts/scripts.module';
import { NestFactory } from '@nestjs/core';
import { EventEmitter } from 'events';

async function runScript(scriptName): Promise<any> {
  console.log('scriptName: ', scriptName);
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
  await script.run();
}

function confirmRun(scriptName): any {
  const prompt = new EventEmitter();
  let current = null;
  let result = null;
  process.stdin.resume();

  process.stdin.on('data', function (data) {
    prompt.emit(current, data.toString().trim());
  });

  prompt.on(':new', function (name, question) {
    current = name;
    console.log(question);
    process.stdout.write('> ');
  });

  prompt.on(':end', function () {
    process.stdin.pause();
    if (result !== 'y') {
      console.log('Operation aborted.');
      process.exit();
      return;
    } else {
      runScript(scriptName).catch((e) => {
        console.log(e);
      });
    }
  });

  prompt.emit(
    ':new',
    'confirm',
    'Are you sure? This might delete existing data in the database. (y/n)',
  );

  prompt.on('confirm', function (data) {
    result = data;
    prompt.emit(':end');
  });
}

function main(): void {
  try {
    const name = process.argv[2];

    if (name === 'seed-prod' || process.env.NODE_ENV === 'development') {
      runScript(name).catch((e) => {
        console.log(e);
      });
    } else {
      confirmRun(name).catch((e) => {
        console.log(e);
      });
    }
  } catch (error) {
    throw error;
  }
}

main();
