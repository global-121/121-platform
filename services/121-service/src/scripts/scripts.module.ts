import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScriptsController } from './scripts.controller';
import { SeedDev } from './seed-dev';
import { SeedHelper } from './seed-helper';
import { SeedInit } from './seed-init';
import { SeedProd } from './seed-prod';
import { SeedDemoProgram } from './seed-program-demo';
import SeedProgramEth from './seed-program-eth';
import SeedProgramLbn from './seed-program-lbn';
import { SeedPilotNLProgram } from './seed-program-pilot-nl';
import { SeedPilotNL2Program } from './seed-program-pilot-nl-2';
import { SeedProgramValidation } from './seed-program-validation';

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
    SeedProgramValidation,
    SeedPilotNLProgram,
    SeedPilotNL2Program,
    SeedProgramEth,
    SeedProgramLbn,
    SeedDemoProgram,
  ],
  controllers: [ScriptsController],
})
export class ScriptsModule {}

export interface InterfaceScript {
  run(): Promise<void>;
}
