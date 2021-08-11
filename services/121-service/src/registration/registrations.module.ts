import { TypeOrmModule } from '@nestjs/typeorm';
import { Module, HttpModule } from '@nestjs/common';
import { ActionEntity } from '../actions/action.entity';
import { ProgramEntity } from '../programs/program/program.entity';
import { UserEntity } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { RegistrationsController } from './registrations.controller';
import { RegistrationsService } from './registrations.service';
import { RegistrationEntity } from './registration.entity';
import { ProgramAnswerEntity } from './program-answer.entity';
import { ProgramQuestionEntity } from '../programs/program/program-question.entity';
import { LookupModule } from '../notifications/lookup/lookup.module';
import { FinancialServiceProviderEntity } from '../programs/fsp/financial-service-provider.entity';
import { FspAttributeEntity } from '../programs/fsp/fsp-attribute.entity';
import { RegistrationStatusChangeEntity } from './registration-status-change.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramEntity,
      UserEntity,
      ActionEntity,
      RegistrationEntity,
      ProgramAnswerEntity,
      ProgramQuestionEntity,
      FinancialServiceProviderEntity,
      FspAttributeEntity,
      RegistrationStatusChangeEntity,
    ]),
    UserModule,
    HttpModule,
    LookupModule,
  ],
  providers: [RegistrationsService],
  controllers: [RegistrationsController],
  exports: [],
})
export class RegistrationsModule {}
