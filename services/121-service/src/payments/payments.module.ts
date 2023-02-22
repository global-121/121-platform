import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionModule } from '../actions/action.module';
import { FinancialServiceProviderEntity } from '../fsp/financial-service-provider.entity';
import { FspQuestionEntity } from '../fsp/fsp-question.entity';
import { FspModule } from '../fsp/fsp.module';
import { LookupService } from '../notifications/lookup/lookup.service';
import { ProgramCustomAttributeEntity } from '../programs/program-custom-attribute.entity';
import { ProgramQuestionEntity } from '../programs/program-question.entity';
import { ProgramEntity } from '../programs/program.entity';
import { RegistrationDataEntity } from '../registration/registration-data.entity';
import { RegistrationEntity } from '../registration/registration.entity';
import { RegistrationsModule } from '../registration/registrations.module';
import { BulkImportService } from '../registration/services/bulk-import.service';
import { InclusionScoreService } from '../registration/services/inclusion-score.service';
import { UserModule } from '../user/user.module';
import { UserEntity } from './../user/user.entity';
import { AfricasTalkingModule } from './fsp-integration/africas-talking/africas-talking.module';
import { BelcashModule } from './fsp-integration/belcash/belcash.module';
import { BobFinanceModule } from './fsp-integration/bob-finance/bob-finance.module';
import { IntersolveVisaModule } from './fsp-integration/intersolve-visa/intersolve-visa.module';
import { IntersolveVoucherModule } from './fsp-integration/intersolve-voucher/intersolve-voucher.module';
import { UkrPoshtaModule } from './fsp-integration/ukrposhta/ukrposhta.module';
import { VodacashModule } from './fsp-integration/vodacash/vodacash.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { TransactionEntity } from './transactions/transaction.entity';
import { TransactionsModule } from './transactions/transactions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramEntity,
      TransactionEntity,
      RegistrationEntity,
      UserEntity,
      RegistrationDataEntity,
      ProgramQuestionEntity,
      FinancialServiceProviderEntity,
      FspQuestionEntity,
      ProgramCustomAttributeEntity,
    ]),
    UserModule,
    HttpModule,
    ActionModule,
    FspModule,
    IntersolveVoucherModule,
    IntersolveVisaModule,
    AfricasTalkingModule,
    BelcashModule,
    TransactionsModule,
    BobFinanceModule,
    UkrPoshtaModule,
    VodacashModule,
    RegistrationsModule,
  ],
  providers: [
    PaymentsService,
    BulkImportService,
    LookupService,
    InclusionScoreService,
  ],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
