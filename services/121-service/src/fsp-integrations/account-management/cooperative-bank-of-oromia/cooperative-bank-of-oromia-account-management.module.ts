import { Module } from '@nestjs/common/decorators/modules/module.decorator';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CooperativeBankOfOromiaAccountManagementController } from '@121-service/src/fsp-integrations/account-management/cooperative-bank-of-oromia/cooperative-bank-of-oromia-account-management.controller';
import { CooperativeBankOfOromiaAccountManagementService } from '@121-service/src/fsp-integrations/account-management/cooperative-bank-of-oromia/cooperative-bank-of-oromia-account-management.service';
import { CooperativeBankOfOromiaAccountValidationEntity } from '@121-service/src/fsp-integrations/account-management/cooperative-bank-of-oromia/entities/cooperative-bank-of-oromia-account-validation.entity';
import { CooperativeBankOfOromiaAccountValidationScopedRepository } from '@121-service/src/fsp-integrations/account-management/cooperative-bank-of-oromia/repositories/cooperative-bank-of-oromia-account-validation.scoped.repository';
import { CooperativeBankOfOromiaModule } from '@121-service/src/fsp-integrations/integrations/cooperative-bank-of-oromia/cooperative-bank-of-oromia.module';
import { ProgramModule } from '@121-service/src/programs/programs.module';
import { RegistrationsModule } from '@121-service/src/registration/registrations.module';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';
import { createScopedRepositoryProvider } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

@Module({
  imports: [
    TypeOrmModule.forFeature([CooperativeBankOfOromiaAccountValidationEntity]),
    CooperativeBankOfOromiaModule,
    RegistrationsModule,
    ProgramModule,
  ],
  providers: [
    CooperativeBankOfOromiaAccountManagementService,
    CooperativeBankOfOromiaAccountValidationScopedRepository,
    createScopedRepositoryProvider(
      CooperativeBankOfOromiaAccountValidationEntity,
    ),
    AzureLogService,
  ],
  controllers: [CooperativeBankOfOromiaAccountManagementController],
  exports: [CooperativeBankOfOromiaAccountManagementService],
})
export class CooperativeBankOfOromiaAccountManagementModule {}
