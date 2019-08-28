import { Module } from '@nestjs/common';
import { SeedDev } from './seed-dev';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { config } from '../config';
import { Arguments } from 'yargs';
import { SeedInit } from './seed-init';
import { SeedProd } from './seed-prod';
import { SeedMVP } from './seed-MVP';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      migrations: [`src/migrations/*.{ts,js}`],
      entities: ['src/app/**/*.entity.{ts,js}'],
    }),
  ],
  providers: [SeedDev, SeedInit, SeedProd, SeedMVP],
})
export class ScriptsModule { }

export interface InterfaceScript {
  run(argv: Arguments): Promise<void>;
}
