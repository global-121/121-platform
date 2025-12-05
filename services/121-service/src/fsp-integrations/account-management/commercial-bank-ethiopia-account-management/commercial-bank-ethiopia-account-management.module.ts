import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CommercialBankEthiopiaAccountManagementController } from '@121-service/src/fsp-integrations/account-management/commercial-bank-ethiopia-account-management/commercial-bank-ethiopia-account-management.controller';
import { CommercialBankEthiopiaAccountManagementService } from '@121-service/src/fsp-integrations/account-management/commercial-bank-ethiopia-account-management/commercial-bank-ethiopia-account-management.service';
import { CommercialBankEthiopiaModule } from '@121-service/src/fsp-integrations/integrations/commercial-bank-ethiopia/commercial-bank-ethiopia.module';
import { CommercialBankEthiopiaAccountEnquiriesEntity } from '@121-service/src/fsp-integrations/integrations/commercial-bank-ethiopia/commercial-bank-ethiopia-account-enquiries.entity';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { RegistrationsModule } from '@121-service/src/registration/registrations.module';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';
import { createScopedRepositoryProvider } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramEntity,
      CommercialBankEthiopiaAccountEnquiriesEntity,
    ]),
    CommercialBankEthiopiaModule,
    RegistrationsModule,
  ],
  providers: [
    CommercialBankEthiopiaAccountManagementService,
    createScopedRepositoryProvider(
      CommercialBankEthiopiaAccountEnquiriesEntity,
    ),
    AzureLogService,
  ],
  controllers: [CommercialBankEthiopiaAccountManagementController],
  exports: [CommercialBankEthiopiaAccountManagementService],
})
export class CommercialBankEthiopiaAccountManagementModule {}
