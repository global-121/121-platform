import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Arguments } from 'yargs';

import { SeedInit } from './seed-init';
import { SeedDev } from './seed-dev';
import { SeedProd } from './seed-prod';
import { SeedHelper } from './seed-helper';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      migrations: [`src/migrations/*.{ts,js}`],
      entities: ['src/app/**/*.entity.{ts,js}'],
    }),
  ],
  providers: [SeedDev, SeedInit, SeedProd, SeedHelper],
})
export class ScriptsModule { }

export interface InterfaceScript {
  run(argv: Arguments): Promise<void>;
}
