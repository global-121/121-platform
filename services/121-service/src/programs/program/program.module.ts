import { FundingModule } from './../../funding/funding.module';
import { VoiceModule } from './../../notifications/voice/voice.module';
import { ProofModule } from './../../sovrin/proof/proof.module';
import { SchemaModule } from './../../sovrin/schema/schema.module';
import { CredentialModule } from './../../sovrin/credential/credential.module';
import { ConnectionEntity } from './../../sovrin/create-connection/connection.entity';
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
  forwardRef,
  HttpModule,
} from '@nestjs/common';
import { ProgramController } from './program.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramEntity } from './program.entity';
import { UserEntity } from '../../user/user.entity';
import { ProgramService } from './program.service';
import { UserModule } from '../../user/user.module';
import { CustomCriterium } from './custom-criterium.entity';
import { ProtectionServiceProviderEntity } from './protection-service-provider.entity';
import { SmsModule } from '../../notifications/sms/sms.module';
import { TransactionEntity } from './transactions.entity';
import { FinancialServiceProviderEntity } from '../fsp/financial-service-provider.entity';
import { ActionEntity } from '../../actions/action.entity';
import { FspCallLogEntity } from '../fsp/fsp-call-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramEntity,
      UserEntity,
      CustomCriterium,
      ConnectionEntity,
      FinancialServiceProviderEntity,
      ProtectionServiceProviderEntity,
      TransactionEntity,
      ActionEntity,
      FspCallLogEntity,
    ]),
    forwardRef(() => CredentialModule),
    UserModule,
    SchemaModule,
    forwardRef(() => SmsModule),
    VoiceModule,
    forwardRef(() => ProofModule),
    FundingModule,
    HttpModule,
  ],
  providers: [ProgramService],
  controllers: [ProgramController],
  exports: [ProgramService],
})
export class ProgramModule {}
