import { NestFactory } from '@nestjs/core';
import { EventEmitter } from 'events';

import { IS_DEVELOPMENT } from '@121-service/src/config';
import {
  InterfaceScript,
  ScriptsModule,
} from '@121-service/src/scripts/scripts.module';

async function runScript(scriptName: string): Promise<void> {
  console.log('scriptName: ', scriptName);
  const context = await NestFactory.createApplicationContext(ScriptsModule);
  const { default: Module } = (await import(
    `${__dirname}/scripts/${scriptName}.ts`
  )) as { default: new (...args: unknown[]) => InterfaceScript };
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

function confirmRun(scriptName: string): void {
  const prompt = new EventEmitter();
  let current: string | null = null;
  let result: string | null = null;
  process.stdin.resume();

  process.stdin.on('data', function (data: Buffer) {
    prompt.emit(current ?? '[empty current]', data.toString().trim());
  });

  prompt.on(':new', function (name: string, question: string) {
    current = name;
    console.log(question);
    process.stdout.write('> ');
  });

  prompt.on(':end', function () {
    process.stdin.pause();
    if (result !== 'y') {
      console.log('Operation aborted.');
      // eslint-disable-next-line n/no-process-exit -- User-initiated exit
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

  prompt.on('confirm', function (data: string) {
    result = data;
    prompt.emit(':end');
  });
}

function main(): void {
  try {
    const name = process.argv[2];

    if (name === 'seed-prod' || IS_DEVELOPMENT) {
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
