import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramAttributesService } from './program-attributes.service';
import { ProgramEntity } from '../programs/program.entity';
import { ProgramQuestionEntity } from '../programs/program-question.entity';
import { ProgramCustomAttributeEntity } from '../programs/program-custom-attribute.entity';
import { FspQuestionEntity } from '../fsp/fsp-question.entity';

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
