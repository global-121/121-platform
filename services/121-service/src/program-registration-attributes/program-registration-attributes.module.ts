import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProgramRegistrationAttributesService } from '@121-service/src/program-registration-attributes/program-registration-attributes.service';
import { AccessGroupLevelsModule } from '@121-service/src/programs/access-group-levels/access-group-levels.module';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';
import { ProgramRegistrationAttributeRepository } from '@121-service/src/programs/repositories/program-registration-attribute.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramEntity,
      ProgramRegistrationAttributeEntity,
    ]),
    AccessGroupLevelsModule,
  ],
  providers: [
    ProgramRegistrationAttributesService,
    ProgramRegistrationAttributeRepository,
  ],
  exports: [
    ProgramRegistrationAttributesService,
    ProgramRegistrationAttributeRepository,
    AccessGroupLevelsModule,
  ],
})
export class ProgramRegistrationAttributesModule {}
