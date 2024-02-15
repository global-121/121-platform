import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createScopedRepositoryProvider } from '../../../utils/scope/createScopedRepositoryProvider.helper';
import { RegistrationDataEntity } from '../../registration-data.entity';
import { RegistrationDataService } from './registration-data.service';

@Module({
  imports: [TypeOrmModule.forFeature([RegistrationDataService])],
  providers: [
    RegistrationDataService,
    createScopedRepositoryProvider(RegistrationDataEntity),
  ],
  exports: [RegistrationDataService],
})
export class RegistrationDataModule {}
