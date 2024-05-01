import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionsModule } from '../actions/actions.module';
import { FspQuestionEntity } from '../financial-service-providers/fsp-question.entity';
import { IntersolveVisaModule } from '../payments/fsp-integration/intersolve-visa/intersolve-visa.module';
import { IntersolveVoucherModule } from '../payments/fsp-integration/intersolve-voucher/intersolve-voucher.module';
import { PaymentsModule } from '../payments/payments.module';
import { TransactionEntity } from '../payments/transactions/transaction.entity';
import { ProgramCustomAttributeEntity } from '../programs/program-custom-attribute.entity';
import { ProgramQuestionEntity } from '../programs/program-question.entity';
import { ProgramEntity } from '../programs/program.entity';

import { EventsModule } from '../events/events.module';
import { RegistrationDataEntity } from '../registration/registration-data.entity';
import { RegistrationsModule } from '../registration/registrations.module';
import { RegistrationScopedRepository } from '../registration/repositories/registration-scoped.repository';
import { RegistrationViewScopedRepository } from '../registration/repositories/registration-view-scoped.repository';
import { UserModule } from '../user/user.module';
import { RegistrationDataScopedQueryService } from '../utils/registration-data-query/registration-data-query.service';
import { createScopedRepositoryProvider } from '../utils/scope/createScopedRepositoryProvider.helper';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

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
