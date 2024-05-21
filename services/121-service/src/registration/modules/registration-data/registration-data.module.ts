import { InstanceEntity } from '@121-service/src/instance/instance.entity';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { RegistrationDataService } from '@121-service/src/registration/modules/registration-data/registration-data.service';
import { RegistrationDataEntity } from '@121-service/src/registration/registration-data.entity';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { createScopedRepositoryProvider } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([ProgramEntity, InstanceEntity])],
  providers: [
    RegistrationDataService,
    createScopedRepositoryProvider(RegistrationDataEntity),
    RegistrationScopedRepository,
  ],
  exports: [RegistrationDataService],
})
export class RegistrationDataModule {}
