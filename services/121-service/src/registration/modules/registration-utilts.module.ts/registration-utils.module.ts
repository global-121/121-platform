import { Module } from '@nestjs/common';
import { RegistrationScopedRepository } from '../../repositories/registration-scoped.repository';
import { RegistrationDataModule } from '../registration-data/registration-data.module';
import { RegistrationUtilsService } from './registration-utils.service';

@Module({
  imports: [RegistrationDataModule],
  providers: [RegistrationScopedRepository, RegistrationUtilsService],
  exports: [RegistrationUtilsService],
})
export class RegistrationUtilsModule {}
