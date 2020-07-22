import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Arguments } from 'yargs';

import { SeedInit } from './seed-init';
import { SeedDev } from './seed-dev';
import { SeedPilot } from './seed-pilot';
import { SeedProd } from './seed-prod';
import { SeedHelper } from './seed-helper';
import { SeedPilotNLProgram } from './seed-program-pilot-nl';
import { SeedPublish } from './seed-publish';
import { ScriptsController } from './scripts.controller';

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
    SeedPilot,
    SeedProd,
    SeedHelper,
    SeedPublish,
    SeedSingleProgram,
    SeedMultiProgram,
    SeedPilotNLProgram,
  ],
  controllers: [ScriptsController],
})
export class ScriptsModule {}

export interface InterfaceScript {
  run(argv: Arguments): Promise<void>;
}
