import { LookupModule } from '../notifications/lookup/lookup.module';
import { CustomCriterium } from '../programs/program/custom-criterium.entity';
import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConnectionService } from './connection.service';
import { ConnectionController } from './connection.controller';
import { ConnectionEntity } from './connection.entity';
import { UserModule } from '../user/user.module';
import { ValidationDataAttributesEntity } from './validation-data/validation-attributes.entity';
import { FinancialServiceProviderEntity } from '../programs/fsp/financial-service-provider.entity';
import { ProgramModule } from '../programs/program/program.module';
import { SmsModule } from '../notifications/sms/sms.module';
import { FspAttributeEntity } from '../programs/fsp/fsp-attribute.entity';
import { TransactionEntity } from '../programs/program/transactions.entity';
import { ProgramEntity } from '../programs/program/program.entity';
import { ActionModule } from '../actions/action.module';
import { ActionEntity } from '../actions/action.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConnectionEntity,
      ValidationDataAttributesEntity,
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
  providers: [ConnectionService],
  controllers: [ConnectionController],
  exports: [ConnectionService],
})
export class ConnectionModule {}
