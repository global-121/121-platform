import { QueueMessageModule } from '@121-service/src/notifications/queue-message/queue-message.module';
import { QueueNamePayment } from '@121-service/src/payments/enum/queue.names.enum';
import { IntersolveVisaChildWalletEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-child-wallet.entity';
import { IntersolveVisaCustomerEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-customer.entity';
import { IntersolveVisaParentWalletEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-parent-wallet.entity';
import { IntersolveVisaApiService } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.api.service';
import { IntersolveVisaController } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.controller';
import { IntersolveVisaService } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.service';
import { PaymentProcessorIntersolveVisa } from '@121-service/src/payments/fsp-integration/intersolve-visa/processors/intersolve-visa.processor';
import { IntersolveVisaExportService } from '@121-service/src/payments/fsp-integration/intersolve-visa/services/intersolve-visa-export.service';
import { IntersolveVisaStatusMappingService } from '@121-service/src/payments/fsp-integration/intersolve-visa/services/intersolve-visa-status-mapping.service';
import { RedisModule } from '@121-service/src/payments/redis.module';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { ProgramFspConfigurationEntity } from '@121-service/src/programs/fsp-configuration/program-fsp-configuration.entity';
import { RegistrationDataModule } from '@121-service/src/registration/modules/registration-data/registration-data.module';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { UserModule } from '@121-service/src/user/user.module';
import { RegistrationDataScopedQueryService } from '@121-service/src/utils/registration-data-query/registration-data-query.service';
import { createScopedRepositoryProvider } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([ProgramFspConfigurationEntity]),
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
    CustomHttpService,
    RegistrationDataScopedQueryService,
    IntersolveVisaExportService,
    IntersolveVisaStatusMappingService,
    PaymentProcessorIntersolveVisa,
    AzureLogService,
    RegistrationScopedRepository,
    createScopedRepositoryProvider(IntersolveVisaParentWalletEntity),
    createScopedRepositoryProvider(IntersolveVisaChildWalletEntity),
    createScopedRepositoryProvider(IntersolveVisaCustomerEntity),
  ],
  controllers: [IntersolveVisaController],
  exports: [
    IntersolveVisaService,
    IntersolveVisaApiService,
    IntersolveVisaExportService,
  ],
})
export class IntersolveVisaModule {}
