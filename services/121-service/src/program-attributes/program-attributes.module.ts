import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramAttributesService } from './program-attributes.service';
import { ProgramEntity } from '../programs/program.entity';
import { ProgramQuestionEntity } from '../programs/program-question.entity';
import { ProgramCustomAttributeEntity } from '../programs/program-custom-attribute.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramEntity,
      ProgramQuestionEntity,
      ProgramCustomAttributeEntity,
    ]),
  ],
  providers: [ProgramAttributesService],
  exports: [ProgramAttributesService],
})
export class ProgramAttributesModule {}
