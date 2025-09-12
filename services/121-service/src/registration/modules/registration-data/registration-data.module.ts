import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OrganizationEntity } from '@121-service/src/organization/organization.entity';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationAttributeDataEntity } from '@121-service/src/registration/entities/registration-attribute-data.entity';
import { RegistrationDataService } from '@121-service/src/registration/modules/registration-data/registration-data.service';
import { RegistrationDataScopedRepository } from '@121-service/src/registration/modules/registration-data/repositories/registration-data.scoped.repository';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramEntity,

      RegistrationAttributeDataEntity,
      RegistrationEntity,
      OrganizationEntity,
      RegistrationAttributeDataEntity,
    ]),
  ],
  providers: [
    RegistrationDataService,
    RegistrationScopedRepository,
    RegistrationDataScopedRepository,
    RegistrationScopedRepository, //TODO This should not be a provider here but an import it's now a provider to prevent a circular import
  ],
  exports: [RegistrationDataService, RegistrationDataScopedRepository],
})
export class RegistrationDataModule {}
