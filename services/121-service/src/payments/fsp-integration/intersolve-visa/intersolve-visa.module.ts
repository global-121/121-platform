import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueueMessageModule } from '../../../notifications/queue-message/queue-message.module';
import { RedisModule } from '../../../payments/redis.module';
import { RegistrationDataModule } from '../../../registration/modules/registration-data/registration-data.module';
import { RegistrationScopedRepository } from '../../../registration/repositories/registration-scoped.repository';
import { AzureLogService } from '../../../shared/services/azure-log.service';
import { CustomHttpService } from '../../../shared/services/custom-http.service';
import { UserModule } from '../../../user/user.module';
import { RegistrationDataScopedQueryService } from '../../../utils/registration-data-query/registration-data-query.service';
import { createScopedRepositoryProvider } from '../../../utils/scope/createScopedRepositoryProvider.helper';
import { QueueNamePayment } from '../../enum/queue.names.enum';
import { TransactionsModule } from '../../transactions/transactions.module';
import { IntersolveVisaApiMockService } from './intersolve-visa-api-mock.service';
import { IntersolveVisaCustomerEntity } from './intersolve-visa-customer.entity';
import { IntersolveVisaWalletEntity } from './intersolve-visa-wallet.entity';
import { IntersolveVisaApiService } from './intersolve-visa.api.service';
import { IntersolveVisaController } from './intersolve-visa.controller';
import { IntersolveVisaService } from './intersolve-visa.service';
import { PaymentProcessorIntersolveVisa } from './processors/intersolve-visa.processor';
import { IntersolveVisaExportService } from './services/intersolve-visa-export.service';
import { IntersolveVisaStatusMappingService } from './services/intersolve-visa-status-mapping.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature(),
    UserModule,
    TransactionsModule,
    QueueMessageModule,
    RegistrationDataModule,
    BullModule.registerQueue({
      name: QueueNamePayment.paymentIntersolveVisa,
      processors: [
        {
          path: 'src/payments/fsp-integration/intersolve-visa/processors/intersolve-visa.processor.ts',
        },
      ],
      limiter: {
        max: 5, // Max number of jobs processed
        duration: 1000, // per duration in milliseconds
      },
    }),
    RedisModule,
  ],
  providers: [
    IntersolveVisaService,
    IntersolveVisaApiService,
    IntersolveVisaApiMockService,
    CustomHttpService,
    RegistrationDataScopedQueryService,
    IntersolveVisaExportService,
    IntersolveVisaStatusMappingService,
    PaymentProcessorIntersolveVisa,
    AzureLogService,
    RegistrationScopedRepository,
    createScopedRepositoryProvider(IntersolveVisaWalletEntity),
    createScopedRepositoryProvider(IntersolveVisaCustomerEntity),
  ],
  controllers: [IntersolveVisaController],
  exports: [
    IntersolveVisaService,
    IntersolveVisaApiService,
    IntersolveVisaApiMockService,
    IntersolveVisaExportService,
  ],
})
export class IntersolveVisaModule {}
