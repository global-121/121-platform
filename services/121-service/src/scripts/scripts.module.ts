import { Module } from '@nestjs/common';
import { Seed } from './seed';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { config } from '../config';
import { Arguments } from 'yargs';
import { SeedProd } from './seedProd';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      migrations: [`src/migrations/*.{ts,js}`],
      entities: ['src/app/**/*.entity.{ts,js}'],
    }),
  ],
  providers: [Seed, SeedProd],
})
export class ScriptsModule {}

export interface InterfaceScript {
  run(argv: Arguments): Promise<void>;
}
