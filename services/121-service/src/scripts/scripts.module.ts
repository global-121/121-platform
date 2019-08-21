import { Module } from '@nestjs/common';
import { SeedDev } from './seed-dev';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { config } from '../config';
import { Arguments } from 'yargs';
import { SeedInit } from './seed-init';
import SeedProd from './seed-prod';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      migrations: [`src/migrations/*.{ts,js}`],
      entities: ['src/app/**/*.entity.{ts,js}'],
    }),
  ],
  providers: [SeedDev, SeedInit, SeedProd],
})
export class ScriptsModule {}

export interface InterfaceScript {
  run(argv: Arguments): Promise<void>;
}
