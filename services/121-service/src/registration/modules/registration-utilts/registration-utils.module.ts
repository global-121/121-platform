import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { RegistrationDataModule } from '@121-service/src/registration/modules/registration-data/registration-data.module';
import { RegistrationUtilsService } from '@121-service/src/registration/modules/registration-utilts/registration-utils.service';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ProgramEntity]), RegistrationDataModule],
  providers: [RegistrationScopedRepository, RegistrationUtilsService],
  exports: [RegistrationUtilsService],
})
export class RegistrationUtilsModule {}
