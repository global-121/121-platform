import { ProgramQuestionEntity } from './program-question.entity';
import { RegistrationEntity } from '../registration/registration.entity';
import { FspModule } from '../fsp/fsp.module';
import { VoiceModule } from '../notifications/voice/voice.module';
import { Module, forwardRef, HttpModule } from '@nestjs/common';
import { ProgramController } from './programs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramEntity } from './program.entity';
import { UserEntity } from '../user/user.entity';
import { ProgramService } from './programs.service';
import { UserModule } from '../user/user.module';
import { SmsModule } from '../notifications/sms/sms.module';
import { FinancialServiceProviderEntity } from '../fsp/financial-service-provider.entity';
import { ActionEntity } from '../actions/action.entity';
import { TransactionEntity } from '../payments/transactions/transaction.entity';
import { ActionModule } from '../actions/action.module';
import { FspAttributeEntity } from '../fsp/fsp-attribute.entity';
import { LookupModule } from '../notifications/lookup/lookup.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramEntity,
      UserEntity,
      FinancialServiceProviderEntity,
      ActionEntity,
      TransactionEntity,
      FspAttributeEntity,
      RegistrationEntity,
      ProgramQuestionEntity,
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
