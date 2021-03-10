import { LookupModule } from './../../notifications/lookup/lookup.module';
import { CustomCriterium } from './../../programs/program/custom-criterium.entity';
import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateConnectionService } from './create-connection.service';
import { CreateConnectionController } from './create-connection.controller';
import { ConnectionEntity } from './connection.entity';
import { UserModule } from '../../user/user.module';
import { CredentialAttributesEntity } from '../credential/credential-attributes.entity';
import { CredentialRequestEntity } from '../credential/credential-request.entity';
import { CredentialEntity } from '../credential/credential.entity';
import { FinancialServiceProviderEntity } from '../../programs/fsp/financial-service-provider.entity';
import { ProgramModule } from '../../programs/program/program.module';
import { SmsModule } from '../../notifications/sms/sms.module';
import { FspAttributeEntity } from '../../programs/fsp/fsp-attribute.entity';
import { TransactionEntity } from '../../programs/program/transactions.entity';
import { ProgramEntity } from '../../programs/program/program.entity';
import { ActionModule } from '../../actions/action.module';
import { ActionEntity } from '../../actions/action.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConnectionEntity,
      CredentialAttributesEntity,
      CredentialRequestEntity,
      CredentialEntity,
      FinancialServiceProviderEntity,
      FspAttributeEntity,
      CustomCriterium,
      TransactionEntity,
      ProgramEntity,
      ActionEntity,
    ]),
    ProgramModule,
    UserModule,
    HttpModule,
    SmsModule,
    LookupModule,
    ActionModule,
  ],
  providers: [CreateConnectionService],
  controllers: [CreateConnectionController],
  exports: [CreateConnectionService],
})
export class CreateConnectionModule {}
