import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProgramAttributesService } from '@121-service/src/program-attributes/program-attributes.service';
import { ProjectEntity } from '@121-service/src/programs/program.entity';
import { ProjectRegistrationAttributeEntity } from '@121-service/src/programs/program-registration-attribute.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProjectEntity,
      ProjectRegistrationAttributeEntity,
    ]),
  ],
  providers: [ProgramAttributesService],
  exports: [ProgramAttributesService],
})
export class ProgramAttributesModule {}
