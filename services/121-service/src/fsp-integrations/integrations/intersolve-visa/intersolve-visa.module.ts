import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { VisaCardOrderEntity } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/entities/intersolve-visa-card-order.entity';
import { IntersolveVisaChildWalletEntity } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/entities/intersolve-visa-child-wallet.entity';
import { IntersolveVisaCustomerEntity } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/entities/intersolve-visa-customer.entity';
import { IntersolveVisaParentWalletEntity } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/entities/intersolve-visa-parent-wallet.entity';
import { IntersolveVisaWalletClosureEntity } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/entities/intersolve-visa-wallet-closure.entity';
import { IntersolveVisaCardOrderRepository } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/repositories/intersolve-visa-card-order.repository';
import { IntersolveVisaChildWalletScopedRepository } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/repositories/intersolve-visa-child-wallet.scoped.repository';
import { IntersolveVisaCustomerScopedRepository } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/repositories/intersolve-visa-customer.scoped.repository';
import { IntersolveVisaParentWalletScopedRepository } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/repositories/intersolve-visa-parent-wallet.scoped.repository';
import { IntersolveVisaWalletClosureScopedRepository } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/repositories/intersolve-visa-wallet-closure.scoped.repository';
import { IntersolveVisaApiService } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/services/intersolve-visa.api.service';
import { IntersolveVisaService } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/services/intersolve-visa.service';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { UserModule } from '@121-service/src/user/user.module';
import { createScopedRepositoryProvider } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';
import { TokenValidationService } from '@121-service/src/utils/token/token-validation.service';

@Module({
  imports: [
    HttpModule,
    UserModule,
    TypeOrmModule.forFeature([
      IntersolveVisaCustomerEntity,
      IntersolveVisaParentWalletEntity,
      IntersolveVisaChildWalletEntity,
      IntersolveVisaWalletClosureEntity,
      VisaCardOrderEntity,
    ]),
  ],
  providers: [
    IntersolveVisaService,
    IntersolveVisaApiService,
    CustomHttpService,
    AzureLogService,
    TokenValidationService,
    IntersolveVisaCustomerScopedRepository,
    IntersolveVisaParentWalletScopedRepository,
    IntersolveVisaChildWalletScopedRepository,
    IntersolveVisaCardOrderRepository,
    IntersolveVisaWalletClosureScopedRepository,
    createScopedRepositoryProvider(IntersolveVisaWalletClosureEntity),
  ],
  exports: [
    IntersolveVisaService,
    IntersolveVisaCustomerScopedRepository,
    IntersolveVisaChildWalletScopedRepository,
    IntersolveVisaCardOrderRepository,
    IntersolveVisaWalletClosureScopedRepository,
  ],
})
export class IntersolveVisaModule {}
