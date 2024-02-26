import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialServiceProviderAttributeEntity } from '../financial-service-providers/financial-service-provider-attribute.entity';
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
      FinancialServiceProviderAttributeEntity,
    ]),
  ],
  providers: [ProgramAttributesService],
  exports: [ProgramAttributesService],
})
export class ProgramAttributesModule {}
