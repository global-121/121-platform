import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { IntersolveVoucherEntity } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.entity';
import { IntersolveVoucherModule } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.module';
import { IntersolveVoucherReconciliationController } from '@121-service/src/payments/reconciliation/intersolve-voucher-reconciliation/intersolve-voucher-reconciliation.controller';
import { IntersolveVoucherReconciliationService } from '@121-service/src/payments/reconciliation/intersolve-voucher-reconciliation/intersolve-voucher-reconciliation.service';
import { ProgramFinancialServiceProviderConfigurationsModule } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.module';
import { ProgramModule } from '@121-service/src/programs/programs.module';
import { createScopedRepositoryProvider } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

@Module({
  imports: [
    TypeOrmModule.forFeature([IntersolveVoucherEntity]),
    IntersolveVoucherModule,
    ProgramModule,
    ProgramFinancialServiceProviderConfigurationsModule,
  ],
  providers: [
    IntersolveVoucherReconciliationService,
    createScopedRepositoryProvider(IntersolveVoucherEntity),
  ],
  controllers: [IntersolveVoucherReconciliationController],
})
export class IntersolveVoucherReconciliationModule {}
