import { Module } from '@nestjs/common';

import { IntersolveVisaAccountManagementController } from '@121-service/src/fsp-integrations/account-management/intersolve-visa/intersolve-visa-account-management.controller';
import { IntersolveVisaAccountManagementService } from '@121-service/src/fsp-integrations/account-management/intersolve-visa/services/intersolve-visa-account-management.service';
import { IntersolveVisaCardOrderProcessorService } from '@121-service/src/fsp-integrations/account-management/intersolve-visa/services/intersolve-visa-card-order-processor.service';
import { IntersolveVisaDataSynchronizationModule } from '@121-service/src/fsp-integrations/data-synchronization/intersolve-visa/intersolve-visa-data-synchronization.module';
import { IntersolveVisaModule } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/intersolve-visa.module';
import { MessageQueuesModule } from '@121-service/src/notifications/message-queues/message-queues.module';
import { ProgramFspConfigurationsModule } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.module';
import { RegistrationsModule } from '@121-service/src/registration/registrations.module';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';
import { UserModule } from '@121-service/src/user/user.module';

@Module({
  imports: [
    MessageQueuesModule,
    IntersolveVisaModule,
    ProgramFspConfigurationsModule,
    UserModule,
    RegistrationsModule,
    IntersolveVisaDataSynchronizationModule,
  ],
  controllers: [IntersolveVisaAccountManagementController],
  providers: [
    IntersolveVisaAccountManagementService,
    IntersolveVisaCardOrderProcessorService,
    AzureLogService,
  ],
  exports: [],
})
export class IntersolveVisaAccountManagementModule {}
