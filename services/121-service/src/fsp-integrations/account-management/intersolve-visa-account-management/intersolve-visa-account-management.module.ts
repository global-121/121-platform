import { Module } from '@nestjs/common';

import { IntersolveVisaAccountManagementController } from '@121-service/src/fsp-integrations/account-management/intersolve-visa-account-management/intersolve-visa-account-management.controller';
import { IntersolveVisaAccountManagementService } from '@121-service/src/fsp-integrations/account-management/intersolve-visa-account-management/intersolve-visa-account-management.service';
import { IntersolveVisaDataSynchronizationModule } from '@121-service/src/fsp-integrations/data-synchronization/intersolve-visa-data-synchronization/intersolve-visa-data-synchronization.module';
import { IntersolveVisaModule } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/intersolve-visa.module';
import { MessageQueuesModule } from '@121-service/src/notifications/message-queues/message-queues.module';
import { ProgramFspConfigurationsModule } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.module';
import { RegistrationsModule } from '@121-service/src/registration/registrations.module';
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
  providers: [IntersolveVisaAccountManagementService],
  exports: [IntersolveVisaAccountManagementService],
})
export class IntersolveVisaAccountManagementModule {}
