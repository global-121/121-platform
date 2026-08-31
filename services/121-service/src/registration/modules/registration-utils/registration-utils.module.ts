import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { RegistrationDataModule } from '@121-service/src/registration/modules/registration-data/registration-data.module';
import { RegistrationUtilsService } from '@121-service/src/registration/modules/registration-utils/registration-utils.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProgramEntity]), RegistrationDataModule],
  providers: [RegistrationUtilsService],
  exports: [RegistrationUtilsService],
})
export class RegistrationUtilsModule {}
