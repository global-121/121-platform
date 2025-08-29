import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProjectEntity } from '@121-service/src/projects/project.entity';
import { RegistrationDataModule } from '@121-service/src/registration/modules/registration-data/registration-data.module';
import { RegistrationUtilsService } from '@121-service/src/registration/modules/registration-utilts/registration-utils.service';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectEntity]), RegistrationDataModule],
  providers: [RegistrationScopedRepository, RegistrationUtilsService],
  exports: [RegistrationUtilsService],
})
export class RegistrationUtilsModule {}
