import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProgramRegistrationAttributesService } from '@121-service/src/program-registration-attributes/program-registration-attributes.service';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramEntity,
      ProgramRegistrationAttributeEntity,
    ]),
  ],
  providers: [ProgramRegistrationAttributesService],
  exports: [ProgramRegistrationAttributesService],
})
export class ProgramRegistrationAttributesModule {}
