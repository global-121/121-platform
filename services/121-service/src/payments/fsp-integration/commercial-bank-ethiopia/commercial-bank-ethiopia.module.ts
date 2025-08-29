import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CommercialBankEthiopiaController } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/commercial-bank-ethiopia.controller';
import { CommercialBankEthiopiaAccountEnquiriesEntity } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/commercial-bank-ethiopia-account-enquiries.entity';
import { PaymentProcessorCommercialBankEthiopia } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/processors/commercial-bank-ethiopia.processor';
import { CommercialBankEthiopiaApiService } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/services/commercial-bank-ethiopia.api.service';
import { CommercialBankEthiopiaService } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/services/commercial-bank-ethiopia.service';
import { RedisModule } from '@121-service/src/payments/redis/redis.module';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { ProjectFspConfigurationEntity } from '@121-service/src/project-fsp-configurations/entities/project-fsp-configuration.entity';
import { ProjectFspConfigurationRepository } from '@121-service/src/project-fsp-configurations/project-fsp-configurations.repository';
import { ProjectEntity } from '@121-service/src/projects/project.entity';
import { QueuesRegistryModule } from '@121-service/src/queues-registry/queues-registry.module';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { UserModule } from '@121-service/src/user/user.module';
import { createScopedRepositoryProvider } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';
import { SoapService } from '@121-service/src/utils/soap/soap.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([
      RegistrationEntity,
      TransactionEntity,
      ProjectEntity,
      ProjectFspConfigurationEntity,
    ]),
    TransactionsModule,
    UserModule,
    RedisModule,
    QueuesRegistryModule,
  ],
  providers: [
    CommercialBankEthiopiaService,
    CommercialBankEthiopiaApiService,
    SoapService,
    CustomHttpService,
    createScopedRepositoryProvider(
      CommercialBankEthiopiaAccountEnquiriesEntity,
    ),
    PaymentProcessorCommercialBankEthiopia,
    ProjectFspConfigurationRepository,
  ],
  controllers: [CommercialBankEthiopiaController],
  exports: [CommercialBankEthiopiaApiService, CommercialBankEthiopiaService],
})
export class CommercialBankEthiopiaModule {}
