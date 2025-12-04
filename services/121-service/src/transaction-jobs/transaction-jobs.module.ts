import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FspsModule } from '@121-service/src/fsp-management/fsp.module';
import { MessageQueuesModule } from '@121-service/src/notifications/message-queues/message-queues.module';
import { MessageTemplateModule } from '@121-service/src/notifications/message-template/message-template.module';
import { AirtelModule } from '@121-service/src/payments/fsp-integration/airtel/airtel.module';
import { CommercialBankEthiopiaModule } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/commercial-bank-ethiopia.module';
import { CooperativeBankOfOromiaModule } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/cooperative-bank-of-oromia.module';
import { ExcelModule } from '@121-service/src/payments/fsp-integration/excel/excel.module';
import { IntersolveVisaModule } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.module';
import { IntersolveVoucherModule } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.module';
import { NedbankModule } from '@121-service/src/payments/fsp-integration/nedbank/nedbank.module';
import { OnafriqTransactionEntity } from '@121-service/src/payments/fsp-integration/onafriq/entities/onafriq-transaction.entity';
import { OnafriqModule } from '@121-service/src/payments/fsp-integration/onafriq/onafriq.module';
import { SafaricomModule } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.module';
import { RedisModule } from '@121-service/src/payments/redis/redis.module';
import { TransactionEventEntity } from '@121-service/src/payments/transactions/transaction-events/entities/transaction-event.entity';
import { TransactionEventsScopedRepository } from '@121-service/src/payments/transactions/transaction-events/repositories/transaction-events.scoped.repository';
import { TransactionEventsModule } from '@121-service/src/payments/transactions/transaction-events/transaction-events.module';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { ProgramFspConfigurationsModule } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.module';
import { ProgramModule } from '@121-service/src/programs/programs.module';
import { RegistrationsModule } from '@121-service/src/registration/registrations.module';
import { RegistrationEventsModule } from '@121-service/src/registration-events/registration-events.module';
import { TransactionJobsProcessorAirtel } from '@121-service/src/transaction-jobs/processors/transaction-jobs-airtel.processor';
import { TransactionJobsProcessorCommercialBankEthiopia } from '@121-service/src/transaction-jobs/processors/transaction-jobs-commercial-bank-ethiopia.processor';
import { TransactionJobsProcessorCooperativeBankOfOromia } from '@121-service/src/transaction-jobs/processors/transaction-jobs-cooperative-bank-of-oromia.processor';
import { TransactionJobsProcessorExcel } from '@121-service/src/transaction-jobs/processors/transaction-jobs-excel.processor';
import { TransactionJobsProcessorIntersolveVisa } from '@121-service/src/transaction-jobs/processors/transaction-jobs-intersolve-visa.processor';
import { TransactionJobsProcessorIntersolveVoucher } from '@121-service/src/transaction-jobs/processors/transaction-jobs-intersolve-voucher.processor';
import { TransactionJobsProcessorNedbank } from '@121-service/src/transaction-jobs/processors/transaction-jobs-nedbank.processor';
import { TransactionJobsProcessorOnafriq } from '@121-service/src/transaction-jobs/processors/transaction-jobs-onafriq.processor';
import { TransactionJobsProcessorSafaricom } from '@121-service/src/transaction-jobs/processors/transaction-jobs-safaricom.processor';
import { TransactionJobsAirtelService } from '@121-service/src/transaction-jobs/services/transaction-jobs-airtel.service';
import { TransactionJobsCommercialBankEthiopiaService } from '@121-service/src/transaction-jobs/services/transaction-jobs-commercial-bank-ethiopia.service';
import { TransactionJobsCooperativeBankOfOromiaService } from '@121-service/src/transaction-jobs/services/transaction-jobs-cooperative-bank-of-oromia.service';
import { TransactionJobsExcelService } from '@121-service/src/transaction-jobs/services/transaction-jobs-excel.service';
import { TransactionJobsHelperService } from '@121-service/src/transaction-jobs/services/transaction-jobs-helper.service';
import { TransactionJobsIntersolveVisaService } from '@121-service/src/transaction-jobs/services/transaction-jobs-intersolve-visa.service';
import { TransactionJobsIntersolveVoucherService } from '@121-service/src/transaction-jobs/services/transaction-jobs-intersolve-voucher.service';
import { TransactionJobsNedbankService } from '@121-service/src/transaction-jobs/services/transaction-jobs-nedbank.service';
import { TransactionJobsOnafriqService } from '@121-service/src/transaction-jobs/services/transaction-jobs-onafriq.service';
import { TransactionJobsSafaricomService } from '@121-service/src/transaction-jobs/services/transaction-jobs-safaricom.service';
import { createScopedRepositoryProvider } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

@Module({
  imports: [
    TypeOrmModule.forFeature([TransactionEventEntity]),
    RedisModule,
    IntersolveVisaModule,
    IntersolveVoucherModule,
    SafaricomModule,
    AirtelModule,
    CooperativeBankOfOromiaModule,
    NedbankModule,
    ProgramFspConfigurationsModule,
    OnafriqModule,
    CommercialBankEthiopiaModule,
    ExcelModule,
    RegistrationsModule,
    ProgramModule,
    TransactionsModule,
    MessageQueuesModule,
    FspsModule,
    RegistrationEventsModule,
    MessageTemplateModule,
    TransactionEventsModule,
  ],
  providers: [
    TransactionJobsHelperService,
    TransactionJobsNedbankService,
    TransactionJobsSafaricomService,
    TransactionJobsAirtelService,
    TransactionJobsCooperativeBankOfOromiaService,
    TransactionJobsIntersolveVisaService,
    TransactionJobsIntersolveVoucherService,
    TransactionJobsOnafriqService,
    TransactionJobsCommercialBankEthiopiaService,
    TransactionJobsExcelService,
    TransactionJobsProcessorIntersolveVisa,
    TransactionJobsProcessorIntersolveVoucher,
    TransactionJobsProcessorSafaricom,
    TransactionJobsProcessorAirtel,
    TransactionJobsProcessorCooperativeBankOfOromia,
    TransactionJobsProcessorNedbank,
    TransactionJobsProcessorOnafriq,
    TransactionJobsProcessorCommercialBankEthiopia,
    TransactionJobsProcessorExcel,
    createScopedRepositoryProvider(OnafriqTransactionEntity),
    TransactionEventsScopedRepository,
  ],
})
export class TransactionJobsModule {}
