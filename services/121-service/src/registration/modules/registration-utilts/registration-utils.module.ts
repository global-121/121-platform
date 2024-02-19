import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramEntity } from '../../../programs/program.entity';
import { RegistrationScopedRepository } from '../../repositories/registration-scoped.repository';
import { RegistrationDataModule } from '../registration-data/registration-data.module';
import { RegistrationUtilsService } from './registration-utils.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProgramEntity]), RegistrationDataModule],
  providers: [RegistrationScopedRepository, RegistrationUtilsService],
  exports: [RegistrationUtilsService],
})
export class RegistrationUtilsModule {}
