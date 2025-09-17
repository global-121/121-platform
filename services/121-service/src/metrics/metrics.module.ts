import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ActionsModule } from '@121-service/src/actions/actions.module';
import { MetricsController } from '@121-service/src/metrics/metrics.controller';
import { MetricsService } from '@121-service/src/metrics/metrics.service';
import { IntersolveVisaModule } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.module';
import { IntersolveVoucherModule } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.module';
import { SafaricomTransferEntity } from '@121-service/src/payments/fsp-integration/safaricom/entities/safaricom-transfer.entity';
import { PaymentsModule } from '@121-service/src/payments/payments.module';
import { TransactionEntity } from '@121-service/src/payments/transactions/entities/transaction.entity';
import { ProgramModule } from '@121-service/src/programs/programs.module';
import { RegistrationDataModule } from '@121-service/src/registration/modules/registration-data/registration-data.module';
import { RegistrationsModule } from '@121-service/src/registration/registrations.module';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';
import { RegistrationEventsModule } from '@121-service/src/registration-events/registration-events.module';
import { UserModule } from '@121-service/src/user/user.module';
import { createScopedRepositoryProvider } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

@Module({
  imports: [
    TypeOrmModule.forFeature([SafaricomTransferEntity]),
    UserModule,
    RegistrationsModule,
    ActionsModule,
    PaymentsModule,
    IntersolveVisaModule,
    IntersolveVoucherModule,
    RegistrationEventsModule,
    RegistrationDataModule,
    ProgramModule,
  ],
  providers: [
    MetricsService,
    RegistrationScopedRepository,
    RegistrationViewScopedRepository,
    createScopedRepositoryProvider(TransactionEntity),
  ],
  controllers: [MetricsController],
  exports: [],
})
export class MetricsModule {}
