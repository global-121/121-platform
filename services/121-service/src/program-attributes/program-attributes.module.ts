import { FspQuestionEntity } from '@121-service/src/financial-service-providers/fsp-question.entity';
import { ProgramAttributesService } from '@121-service/src/program-attributes/program-attributes.service';
import { ProgramCustomAttributeEntity } from '@121-service/src/programs/program-custom-attribute.entity';
import { ProgramQuestionEntity } from '@121-service/src/programs/program-question.entity';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramEntity,
      ProgramQuestionEntity,
      ProgramCustomAttributeEntity,
      FspQuestionEntity,
    ]),
  ],
  providers: [ProgramAttributesService],
  exports: [ProgramAttributesService],
})
export class ProgramAttributesModule {}
