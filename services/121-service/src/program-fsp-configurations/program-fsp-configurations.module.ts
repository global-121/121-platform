import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';
import { ProgramFspConfigurationPropertyEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration-property.entity';
import { ProgramFspConfigurationsController } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.controller';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramFspConfigurationsService } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramFspConfigurationEntity,
      ProgramFspConfigurationPropertyEntity,
    ]),
  ],
  providers: [
    ProgramFspConfigurationsService,
    ProgramFspConfigurationRepository,
  ],
  controllers: [ProgramFspConfigurationsController],
  exports: [ProgramFspConfigurationRepository, ProgramFspConfigurationsService],
})
export class ProgramFspConfigurationsModule {}
