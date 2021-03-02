import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Arguments } from 'yargs';
import { ScriptsController } from './scripts.controller';

import { SeedInit } from './seed-init';
import { SeedDev } from './seed-dev';
import { SeedProd } from './seed-prod';
import { SeedHelper } from './seed-helper';
import { SeedMultiProgram } from './seed-program-multi';
import { SeedProgramValidation } from './seed-program-validation';
import { SeedPilotNLProgram } from './seed-program-pilot-nl';
import { SeedPilotNL2Program } from './seed-program-pilot-nl-2';
import { SeedPilotKenProgram } from './seed-program-pilot-ken';
import { SeedDemoProgram } from './seed-program-demo';
import { SeedPublish } from './seed-publish';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      migrations: [`src/migrations/*.{ts,js}`],
      entities: ['src/app/**/*.entity.{ts,js}'],
    }),
  ],
  providers: [
    SeedDev,
    SeedInit,
    SeedProd,
    SeedHelper,
    SeedPublish,
    SeedProgramValidation,
    SeedMultiProgram,
    SeedPilotNLProgram,
    SeedPilotNL2Program,
    SeedPilotKenProgram,
    SeedDemoProgram,
  ],
  controllers: [ScriptsController],
})
export class ScriptsModule {}

export interface InterfaceScript {
  run(argv: Arguments): Promise<void>;
}
