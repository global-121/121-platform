import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CommercialBankEthiopiaModule } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/commercial-bank-ethiopia.module';
import { CommercialBankEthiopiaAccountEnquiriesEntity } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/commercial-bank-ethiopia-account-enquiries.entity';
import { CommercialBankEthiopiaReconciliationController } from '@121-service/src/payments/reconciliation/commercial-bank-ethiopia-reconciliation/commercial-bank-ethiopia-reconciliation.controller';
import { CommercialBankEthiopiaReconciliationService } from '@121-service/src/payments/reconciliation/commercial-bank-ethiopia-reconciliation/commercial-bank-ethiopia-reconciliation.service';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { RegistrationsModule } from '@121-service/src/registration/registrations.module';
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
    CommercialBankEthiopiaReconciliationService,
    createScopedRepositoryProvider(
      CommercialBankEthiopiaAccountEnquiriesEntity,
    ),
  ],
  controllers: [CommercialBankEthiopiaReconciliationController],
})
export class CommercialBankEthiopiaReconciliationModule {}
