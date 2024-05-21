import { ActionsModule } from '@121-service/src/actions/actions.module';
import { FspQuestionEntity } from '@121-service/src/financial-service-providers/fsp-question.entity';
import { IntersolveVisaModule } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.module';
import { IntersolveVoucherModule } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.module';
import { PaymentsModule } from '@121-service/src/payments/payments.module';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { ProgramCustomAttributeEntity } from '@121-service/src/programs/program-custom-attribute.entity';
import { ProgramQuestionEntity } from '@121-service/src/programs/program-question.entity';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EventsModule } from '@121-service/src/events/events.module';
import { MetricsController } from '@121-service/src/metrics/metrics.controller';
import { MetricsService } from '@121-service/src/metrics/metrics.service';
import { RegistrationDataEntity } from '@121-service/src/registration/registration-data.entity';
import { RegistrationsModule } from '@121-service/src/registration/registrations.module';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';
import { UserModule } from '@121-service/src/user/user.module';
import { RegistrationDataScopedQueryService } from '@121-service/src/utils/registration-data-query/registration-data-query.service';
import { createScopedRepositoryProvider } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramQuestionEntity,
      ProgramCustomAttributeEntity,
      FspQuestionEntity,
      ProgramEntity,
    ]),
    UserModule,
    RegistrationsModule,
    ActionsModule,
    PaymentsModule,
    IntersolveVisaModule,
    IntersolveVoucherModule,
    EventsModule,
  ],
  providers: [
    MetricsService,
    RegistrationDataScopedQueryService,
    RegistrationScopedRepository,
    RegistrationViewScopedRepository,
    createScopedRepositoryProvider(RegistrationDataEntity),
    createScopedRepositoryProvider(TransactionEntity),
  ],
  controllers: [MetricsController],
  exports: [],
})
export class MetricsModule {}
