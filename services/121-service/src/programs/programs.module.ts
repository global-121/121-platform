import { forwardRef, HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionEntity } from '../actions/action.entity';
import { ActionModule } from '../actions/action.module';
import { FinancialServiceProviderEntity } from '../fsp/financial-service-provider.entity';
import { FspQuestionEntity } from '../fsp/fsp-question.entity';
import { FspModule } from '../fsp/fsp.module';
import { LookupModule } from '../notifications/lookup/lookup.module';
import { SmsModule } from '../notifications/sms/sms.module';
import { VoiceModule } from '../notifications/voice/voice.module';
import { TransactionEntity } from '../payments/transactions/transaction.entity';
import { RegistrationEntity } from '../registration/registration.entity';
import { UserEntity } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { ProgramCustomAttributeEntity } from './program-custom-attribute.entity';
import { ProgramQuestionEntity } from './program-question.entity';
import { ProgramEntity } from './program.entity';
import { ProgramController } from './programs.controller';
import { ProgramService } from './programs.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramEntity,
      UserEntity,
      FinancialServiceProviderEntity,
      ActionEntity,
      TransactionEntity,
      FspQuestionEntity,
      RegistrationEntity,
      ProgramQuestionEntity,
      ProgramCustomAttributeEntity,
    ]),
    ActionModule,
    UserModule,
    forwardRef(() => SmsModule),
    VoiceModule,
    FspModule,
    HttpModule,
    LookupModule,
  ],
  providers: [ProgramService],
  controllers: [ProgramController],
  exports: [ProgramService],
})
export class ProgramModule {}
