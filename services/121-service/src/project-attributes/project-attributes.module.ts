import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProjectAttributesService } from '@121-service/src/project-attributes/project-attributes.service';
import { ProjectEntity } from '@121-service/src/projects/entities/project.entity';
import { ProjectRegistrationAttributeEntity } from '@121-service/src/projects/entities/project-registration-attribute.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProjectEntity,
      ProjectRegistrationAttributeEntity,
    ]),
  ],
  providers: [ProjectAttributesService],
  exports: [ProjectAttributesService],
})
export class ProjectAttributesModule {}
