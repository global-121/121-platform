import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProjectFspConfigurationEntity } from '@121-service/src/project-fsp-configurations/entities/project-fsp-configuration.entity';
import { ProjectFspConfigurationPropertyEntity } from '@121-service/src/project-fsp-configurations/entities/project-fsp-configuration-property.entity';
import { ProjectFspConfigurationsController } from '@121-service/src/project-fsp-configurations/project-fsp-configurations.controller';
import { ProjectFspConfigurationRepository } from '@121-service/src/project-fsp-configurations/project-fsp-configurations.repository';
import { ProjectFspConfigurationsService } from '@121-service/src/project-fsp-configurations/project-fsp-configurations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProjectFspConfigurationEntity,
      ProjectFspConfigurationPropertyEntity,
    ]),
  ],
  providers: [
    ProjectFspConfigurationsService,
    ProjectFspConfigurationRepository,
  ],
  controllers: [ProjectFspConfigurationsController],
  exports: [ProjectFspConfigurationRepository, ProjectFspConfigurationsService],
})
export class ProjectFspConfigurationsModule {}
