import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { RegistrationDataService } from '@121-service/src/registration/modules/registration-data/registration-data.service';
import { RegistrationDataScopedRepository } from '@121-service/src/registration/modules/registration-data/repositories/registration-data.scoped.repository';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationDataEntity } from '@121-service/src/registration/registration-data.entity';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramEntity,
      RegistrationDataEntity,
      RegistrationEntity,
    ]),
  ],
  providers: [
    RegistrationDataService,
    RegistrationScopedRepository,
    RegistrationDataScopedRepository,
  ],
  exports: [RegistrationDataService, RegistrationDataScopedRepository],
})
export class RegistrationDataModule {}
