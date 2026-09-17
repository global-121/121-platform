import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProgramRegistrationAttributeLockService } from '@121-service/src/program-registration-attributes/program-registration-attribute-lock.service';
import { ProgramRegistrationAttributesService } from '@121-service/src/program-registration-attributes/program-registration-attributes.service';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';
import { ProgramRegistrationAttributeRepository } from '@121-service/src/programs/repositories/program-registration-attribute.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramEntity,
      ProgramRegistrationAttributeEntity,
    ]),
  ],
  providers: [
    ProgramRegistrationAttributesService,
    ProgramRegistrationAttributeLockService,
    ProgramRegistrationAttributeRepository,
  ],
  exports: [
    ProgramRegistrationAttributesService,
    ProgramRegistrationAttributeLockService,
    ProgramRegistrationAttributeRepository,
  ],
})
export class ProgramRegistrationAttributesModule {}
