import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ActionEntity } from '@121-service/src/actions/action.entity';
import { ActionsModule } from '@121-service/src/actions/actions.module';
import { FspsModule } from '@121-service/src/fsps/fsp.module';
import { KoboConnectModule } from '@121-service/src/kobo-connect/kobo-connect.module';
import { LookupModule } from '@121-service/src/notifications/lookup/lookup.module';
import { IntersolveVisaModule } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.module';
import { ProjectAttributesModule } from '@121-service/src/project-attributes/project-attributes.module';
import { ProjectFspConfigurationEntity } from '@121-service/src/project-fsp-configurations/entities/project-fsp-configuration.entity';
import { ProjectFspConfigurationsModule } from '@121-service/src/project-fsp-configurations/project-fsp-configurations.module';
import { ProjectEntity } from '@121-service/src/projects/project.entity';
import { ProjectAttachmentsModule } from '@121-service/src/projects/project-attachments/project-attachments.module';
import { ProjectRegistrationAttributeEntity } from '@121-service/src/projects/project-registration-attribute.entity';
import { ProjectController } from '@121-service/src/projects/projects.controller';
import { ProjectService } from '@121-service/src/projects/projects.service';
import { ProjectRepository } from '@121-service/src/projects/repositories/project.repository';
import { ProjectRegistrationAttributeRepository } from '@121-service/src/projects/repositories/project-registration-attribute.repository';
import { ProjectExistenceInterceptor } from '@121-service/src/shared/interceptors/project-existence.interceptor';
import { UserModule } from '@121-service/src/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProjectEntity,
      ProjectRegistrationAttributeEntity,
      ActionEntity,
      ProjectFspConfigurationEntity,
    ]),
    ActionsModule,
    UserModule,
    FspsModule,
    HttpModule,
    LookupModule,
    UserModule,
    ProjectAttachmentsModule,
    ProjectAttributesModule,
    KoboConnectModule,
    ProjectFspConfigurationsModule,
    IntersolveVisaModule,
  ],
  providers: [
    ProjectService,
    ProjectRepository,
    ProjectExistenceInterceptor,
    ProjectRegistrationAttributeRepository,
  ],
  controllers: [ProjectController],
  exports: [
    ProjectService,
    ProjectRepository,
    ProjectRegistrationAttributeRepository,
  ],
})
export class ProjectModule {}
