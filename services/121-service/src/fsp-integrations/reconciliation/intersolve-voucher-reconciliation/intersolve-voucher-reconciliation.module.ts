import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { IntersolveVoucherEntity } from '@121-service/src/fsp-integrations/integrations/intersolve-voucher/entities/intersolve-voucher.entity';
import { IntersolveVoucherModule } from '@121-service/src/fsp-integrations/integrations/intersolve-voucher/intersolve-voucher.module';
import { IntersolveVoucherReconciliationController } from '@121-service/src/fsp-integrations/reconciliation/intersolve-voucher-reconciliation/intersolve-voucher-reconciliation.controller';
import { IntersolveVoucherReconciliationService } from '@121-service/src/fsp-integrations/reconciliation/intersolve-voucher-reconciliation/intersolve-voucher-reconciliation.service';
import { ProgramFspConfigurationsModule } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.module';
import { ProgramModule } from '@121-service/src/programs/programs.module';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';
import { createScopedRepositoryProvider } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

@Module({
  imports: [
    TypeOrmModule.forFeature([IntersolveVoucherEntity]),
    IntersolveVoucherModule,
    ProgramModule,
    ProgramFspConfigurationsModule,
  ],
  providers: [
    IntersolveVoucherReconciliationService,
    createScopedRepositoryProvider(IntersolveVoucherEntity),
    AzureLogService,
  ],
  controllers: [IntersolveVoucherReconciliationController],
  exports: [IntersolveVoucherReconciliationService],
})
export class IntersolveVoucherReconciliationModule {}
