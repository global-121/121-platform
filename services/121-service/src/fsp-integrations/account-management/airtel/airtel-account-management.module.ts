import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AirtelAccountManagementController } from '@121-service/src/fsp-integrations/account-management/airtel/airtel-account-management.controller';
import { AirtelAccountManagementService } from '@121-service/src/fsp-integrations/account-management/airtel/airtel-account-management.service';
import { AirtelUserLookupEntity } from '@121-service/src/fsp-integrations/account-management/airtel/entities/airtel-user-lookup.entity';
import { AirtelUserLookupScopedRepository } from '@121-service/src/fsp-integrations/account-management/airtel/repositories/airtel-user-lookup.scoped.repository';
import { AirtelModule } from '@121-service/src/fsp-integrations/integrations/airtel/airtel.module';
import { ProgramModule } from '@121-service/src/programs/programs.module';
import { RegistrationsModule } from '@121-service/src/registration/registrations.module';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AirtelUserLookupEntity]),
    AirtelModule,
    RegistrationsModule,
    ProgramModule,
  ],
  providers: [
    AirtelAccountManagementService,
    AirtelUserLookupScopedRepository,
    AzureLogService,
  ],
  controllers: [AirtelAccountManagementController],
  exports: [AirtelAccountManagementService],
})
export class AirtelAccountManagementModule {}
