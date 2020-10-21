import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Arguments } from 'yargs';
import { ScriptsController } from './scripts.controller';

import { SeedInit } from './seed-init';
import { SeedDev } from './seed-dev';
import { SeedProd } from './seed-prod';
import { SeedHelper } from './seed-helper';
import { SeedProgramMax } from './seed-program-max';
import { SeedProgramMin } from './seed-program-min';
import { SeedPilotNLProgram } from './seed-program-pilot-nl';
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
    SeedProgramMin,
    SeedProgramMax,
    SeedPilotNLProgram,
    SeedPilotKenProgram,
    SeedDemoProgram,
  ],
  controllers: [ScriptsController],
})
export class ScriptsModule {}

export interface InterfaceScript {
  run(argv: Arguments): Promise<void>;
}
