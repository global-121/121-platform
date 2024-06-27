import { QueueMessageModule } from '@121-service/src/notifications/queue-message/queue-message.module';
import { IntersolveVisaChildWalletEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-child-wallet.entity';
import { IntersolveVisaCustomerEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-customer.entity';
import { IntersolveVisaParentWalletEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-parent-wallet.entity';
import { IntersolveVisaApiService } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.api.service';
import { IntersolveVisaController } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.controller';
import { IntersolveVisaService } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.service';
import { IntersolveVisaChildWalletScopedRepository } from '@121-service/src/payments/fsp-integration/intersolve-visa/repositories/intersolve-visa-child-wallet.scoped.repository';
import { IntersolveVisaCustomerScopedRepository } from '@121-service/src/payments/fsp-integration/intersolve-visa/repositories/intersolve-visa-customer.scoped.repository';
import { IntersolveVisaParentWalletScopedRepository } from '@121-service/src/payments/fsp-integration/intersolve-visa/repositories/intersolve-visa-parent-wallet.scoped.repository';
import { IntersolveVisaExportService } from '@121-service/src/payments/fsp-integration/intersolve-visa/services/intersolve-visa-export.service';
import { IntersolveVisaStatusMappingService } from '@121-service/src/payments/fsp-integration/intersolve-visa/services/intersolve-visa-status-mapping.service';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { ProgramFinancialServiceProviderConfigurationsModule } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.module';
import { RegistrationDataModule } from '@121-service/src/registration/modules/registration-data/registration-data.module';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { UserModule } from '@121-service/src/user/user.module';
import { RegistrationDataScopedQueryService } from '@121-service/src/utils/registration-data-query/registration-data-query.service';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    HttpModule,
    UserModule,
    TransactionsModule,
    QueueMessageModule,
    RegistrationDataModule,
    ProgramFinancialServiceProviderConfigurationsModule,
    TypeOrmModule.forFeature([
      IntersolveVisaCustomerEntity,
      IntersolveVisaParentWalletEntity,
      IntersolveVisaChildWalletEntity,
    ]),
  ],
  providers: [
    IntersolveVisaService,
    IntersolveVisaApiService,
    CustomHttpService,
    RegistrationDataScopedQueryService,
    IntersolveVisaExportService,
    IntersolveVisaStatusMappingService,
    AzureLogService,
    RegistrationScopedRepository,
    IntersolveVisaCustomerScopedRepository,
    IntersolveVisaParentWalletScopedRepository,
    IntersolveVisaChildWalletScopedRepository,
  ],
  controllers: [IntersolveVisaController],
  exports: [IntersolveVisaService, IntersolveVisaExportService],
})
export class IntersolveVisaModule {}
