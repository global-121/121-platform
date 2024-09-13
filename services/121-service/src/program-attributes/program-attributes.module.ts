import { ProgramAttributesService } from '@121-service/src/program-attributes/program-attributes.service';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/program-registration-attribute.entity';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramEntity,
      ProgramRegistrationAttributeEntity,
    ]),
  ],
  providers: [ProgramAttributesService],
  exports: [ProgramAttributesService],
})
export class ProgramAttributesModule {}
