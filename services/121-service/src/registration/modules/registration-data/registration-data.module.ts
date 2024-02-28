import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstanceEntity } from '../../../instance/instance.entity';
import { ProgramEntity } from '../../../programs/program.entity';
import { createScopedRepositoryProvider } from '../../../utils/scope/createScopedRepositoryProvider.helper';
import { RegistrationDataEntity } from '../../registration-data.entity';
import { RegistrationScopedRepository } from '../../repositories/registration-scoped.repository';
import { RegistrationDataService } from './registration-data.service';

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
