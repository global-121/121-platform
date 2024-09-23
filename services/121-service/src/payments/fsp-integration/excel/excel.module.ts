import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LookupService } from '@121-service/src/notifications/lookup/lookup.service';
import { ExcelService } from '@121-service/src/payments/fsp-integration/excel/excel.service';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { ProgramFinancialServiceProviderConfigurationEntity } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configuration.entity';
import { ProgramFinancialServiceProviderConfigurationRepository } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.repository';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { RegistrationsModule } from '@121-service/src/registration/registrations.module';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([
      ProgramEntity,
      ProgramFinancialServiceProviderConfigurationEntity,
    ]),
    TransactionsModule,
    RegistrationsModule,
  ],
  providers: [
    ExcelService,
    LookupService,
    ProgramFinancialServiceProviderConfigurationRepository,
  ],
  controllers: [],
  exports: [ExcelService],
})
export class ExcelModule {}
