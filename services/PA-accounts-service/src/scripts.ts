import { NestFactory } from '@nestjs/core';
import { ScriptsModule, InterfaceScript } from './scripts/scripts.module';

async function main(): Promise<void> {
  try {
    const context = await NestFactory.createApplicationContext(ScriptsModule);
    const name = process.argv[2];
    const { default: Module } = await import(`${__dirname}/scripts/${name}.ts`);
    if (typeof Module !== 'function') {
      throw new TypeError(`Cannot find default Module in scripts/${name}.ts`);
    }
    const script = context.get<InterfaceScript>(Module);
    if (!script) {
      throw new TypeError(`Cannot create instance of ${Module.name}`);
    }
    await script.run();
  } catch (error) {
    throw error;
  }
}

main();
