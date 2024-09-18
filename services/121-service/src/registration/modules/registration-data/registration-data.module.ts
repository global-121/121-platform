import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OrganizationEntity } from '@121-service/src/organization/organization.entity';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { RegistrationDataService } from '@121-service/src/registration/modules/registration-data/registration-data.service';
import { RegistrationDataScopedRepository } from '@121-service/src/registration/modules/registration-data/repositories/registration-data.scoped.repository';
import { RegistrationDataEntity } from '@121-service/src/registration/registration-data.entity';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { createScopedRepositoryProvider } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

@Module({
  imports: [TypeOrmModule.forFeature([ProgramEntity, OrganizationEntity])],
  providers: [
    RegistrationDataService,
    createScopedRepositoryProvider(RegistrationDataEntity),
    RegistrationScopedRepository,
    RegistrationDataScopedRepository,
  ],
  exports: [RegistrationDataService, RegistrationDataScopedRepository],
})
export class RegistrationDataModule {}
