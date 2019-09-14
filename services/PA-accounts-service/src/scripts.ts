import { NestFactory, Reflector } from '@nestjs/core';
import { ScriptsModule, InterfaceScript } from './scripts/scripts.module';
import yargs = require('yargs');
// import 'loud-rejection/register';

async function main(): Promise<void> {
  try {
    const context = await NestFactory.createApplicationContext(ScriptsModule);
    const names: string[] = yargs.argv._;
    // docker exec -it 121-programs-service npx ts-node src/scripts seed
    const name = [names];
    const reflector = context.get(Reflector);
    const { default: Module } = await import(`${__dirname}/scripts/${name}.ts`);
    if (typeof Module !== 'function') {
      throw new TypeError(`Cannot find default Module in scripts/${name}.ts`);
    }
    const script = context.get<InterfaceScript>(Module);
    if (!script) {
      throw new TypeError(`Cannot create instance of ${Module.name}`);
    }
    await script.run(yargs.argv);
  } catch (error) {
    throw error;
  }
}

main();
