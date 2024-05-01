import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FspQuestionEntity } from '../financial-service-providers/fsp-question.entity';
import { ProgramCustomAttributeEntity } from '../programs/program-custom-attribute.entity';
import { ProgramQuestionEntity } from '../programs/program-question.entity';
import { ProgramEntity } from '../programs/program.entity';
import { ProgramAttributesService } from './program-attributes.service';

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
