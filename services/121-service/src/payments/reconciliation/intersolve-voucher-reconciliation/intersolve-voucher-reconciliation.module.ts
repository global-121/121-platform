import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { IntersolveVoucherEntity } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.entity';
import { IntersolveVoucherModule } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.module';
import { IntersolveVoucherReconciliationController } from '@121-service/src/payments/reconciliation/intersolve-voucher-reconciliation/intersolve-voucher-reconciliation.controller';
import { IntersolveVoucherReconciliationService } from '@121-service/src/payments/reconciliation/intersolve-voucher-reconciliation/intersolve-voucher-reconciliation.service';
import { ProjectFspConfigurationsModule } from '@121-service/src/project-fsp-configurations/project-fsp-configurations.module';
import { ProjectModule } from '@121-service/src/projects/projects.module';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';
import { createScopedRepositoryProvider } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

@Module({
  imports: [
    TypeOrmModule.forFeature([IntersolveVoucherEntity]),
    IntersolveVoucherModule,
    ProjectModule,
    ProjectFspConfigurationsModule,
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
