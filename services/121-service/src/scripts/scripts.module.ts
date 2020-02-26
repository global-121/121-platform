import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Arguments } from 'yargs';

import { SeedInit } from './seed-init';
import { SeedDev } from './seed-dev';
import { SeedPilot } from './seed-pilot';
import { SeedProd } from './seed-prod';
import { SeedHelper } from './seed-helper';
import { SeedMultiProgram } from './seed-multi-program';
import { SeedSingleProgram } from './seed-single-program';
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
    SeedPilot,
    SeedProd,
    SeedHelper,
    SeedPublish,
    SeedSingleProgram,
    SeedMultiProgram,
  ],
})
export class ScriptsModule { }

export interface InterfaceScript {
  run(argv: Arguments): Promise<void>;
}
