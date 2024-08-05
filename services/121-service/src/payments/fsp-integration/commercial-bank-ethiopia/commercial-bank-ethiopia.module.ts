import { QueueNamePayment } from '@121-service/src/payments/enum/queue.names.enum';
import { CommercialBankEthiopiaAccountEnquiriesEntity } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/commercial-bank-ethiopia-account-enquiries.entity';
import { CommercialBankEthiopiaApiService } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/commercial-bank-ethiopia.api.service';
import { CommercialBankEthiopiaController } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/commercial-bank-ethiopia.controller';
import { CommercialBankEthiopiaMockService } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/commercial-bank-ethiopia.mock';
import { CommercialBankEthiopiaService } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/commercial-bank-ethiopia.service';
import { PaymentProcessorCommercialBankEthiopia } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/processors/commercial-bank-ethiopia.processor';
import { RedisModule } from '@121-service/src/payments/redis/redis.module';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { ProgramFinancialServiceProviderConfigurationEntity } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configuration.entity';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { UserModule } from '@121-service/src/user/user.module';
import { createScopedRepositoryProvider } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';
import { SoapService } from '@121-service/src/utils/soap/soap.service';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([
      RegistrationEntity,
      TransactionEntity,
      ProgramEntity,
      ProgramFinancialServiceProviderConfigurationEntity,
    ]),
    TransactionsModule,
    UserModule,
    BullModule.registerQueue({
      name: QueueNamePayment.paymentCommercialBankEthiopia,
      processors: [
        {
          path: 'src/payments/fsp-integration/commercial-bank-ethiopia/processors/commercial-bank-ethiopia.processor.ts',
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
    CommercialBankEthiopiaService,
    CommercialBankEthiopiaApiService,
    SoapService,
    CommercialBankEthiopiaMockService,
    CustomHttpService,
    createScopedRepositoryProvider(
      CommercialBankEthiopiaAccountEnquiriesEntity,
    ),
    PaymentProcessorCommercialBankEthiopia,
  ],
  controllers: [CommercialBankEthiopiaController],
  exports: [
    CommercialBankEthiopiaApiService,
    CommercialBankEthiopiaMockService,
    CommercialBankEthiopiaService,
  ],
})
export class CommercialBankEthiopiaModule {}
