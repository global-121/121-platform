import { FspModule } from './../fsp/fsp.module';
import { FundingModule } from './../../funding/funding.module';
import { VoiceModule } from './../../notifications/voice/voice.module';
import { ProofModule } from './../../sovrin/proof/proof.module';
import { SchemaModule } from './../../sovrin/schema/schema.module';
import { CredentialModule } from './../../sovrin/credential/credential.module';
import { ConnectionEntity } from './../../sovrin/create-connection/connection.entity';
import { Module, forwardRef, HttpModule } from '@nestjs/common';
import { ProgramController } from './program.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramEntity } from './program.entity';
import { UserEntity } from '../../user/user.entity';
import { ProgramService } from './program.service';
import { UserModule } from '../../user/user.module';
import { CustomCriterium } from './custom-criterium.entity';
import { ProtectionServiceProviderEntity } from './protection-service-provider.entity';
import { SmsModule } from '../../notifications/sms/sms.module';
import { FinancialServiceProviderEntity } from '../fsp/financial-service-provider.entity';
import { ActionEntity } from '../../actions/action.entity';
import { TransactionEntity } from './transactions.entity';
import { ActionModule } from '../../actions/action.module';
import { FspAttributeEntity } from '../fsp/fsp-attribute.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramEntity,
      UserEntity,
      CustomCriterium,
      ConnectionEntity,
      FinancialServiceProviderEntity,
      ProtectionServiceProviderEntity,
      ActionEntity,
      TransactionEntity,
      FspAttributeEntity,
    ]),
    ActionModule,
    forwardRef(() => CredentialModule),
    UserModule,
    SchemaModule,
    forwardRef(() => SmsModule),
    VoiceModule,
    forwardRef(() => ProofModule),
    FundingModule,
    FspModule,
    HttpModule,
  ],
  providers: [ProgramService],
  controllers: [ProgramController],
  exports: [ProgramService],
})
export class ProgramModule {}
