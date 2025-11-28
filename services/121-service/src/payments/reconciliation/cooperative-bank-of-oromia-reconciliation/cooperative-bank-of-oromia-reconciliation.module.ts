import { Module } from '@nestjs/common/decorators/modules/module.decorator';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CooperativeBankOfOromiaModule } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/cooperative-bank-of-oromia.module';
import { CooperativeBankOfOromiaReconciliationController } from '@121-service/src/payments/reconciliation/cooperative-bank-of-oromia-reconciliation/cooperative-bank-of-oromia-reconciliation.controller';
import { CooperativeBankOfOromiaReconciliationService } from '@121-service/src/payments/reconciliation/cooperative-bank-of-oromia-reconciliation/cooperative-bank-of-oromia-reconciliation.service';
import { CooperativeBankOfOromiaAccountValidationEntity } from '@121-service/src/payments/reconciliation/cooperative-bank-of-oromia-reconciliation/entities/cooperative-bank-of-oromia-account-validation.entity';
import { CooperativeBankOfOromiaAccountValidationScopedRepository } from '@121-service/src/payments/reconciliation/cooperative-bank-of-oromia-reconciliation/repositories/cooperative-bank-of-oromia-account-validation.scoped.repository';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { RegistrationsModule } from '@121-service/src/registration/registrations.module';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';
import { createScopedRepositoryProvider } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramEntity,
      CooperativeBankOfOromiaAccountValidationEntity,
    ]),
    CooperativeBankOfOromiaModule,
    RegistrationsModule,
  ],
  providers: [
    CooperativeBankOfOromiaReconciliationService,
    CooperativeBankOfOromiaAccountValidationScopedRepository,
    createScopedRepositoryProvider(
      CooperativeBankOfOromiaAccountValidationEntity,
    ),
    AzureLogService,
  ],
  controllers: [CooperativeBankOfOromiaReconciliationController],
  exports: [CooperativeBankOfOromiaReconciliationService],
})
export class CooperativeBankOfOromiaReconciliationModule {}
