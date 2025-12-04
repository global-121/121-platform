import { Module } from '@nestjs/common';

import { IntersolveVisaAccountManagementModule } from '@121-service/src/fsp-integrations/account-management/intersolve-visa-account-management/intersolve-visa-account-management.module';
import { IntersolveVisaDataSynchronizationService } from '@121-service/src/fsp-integrations/data-synchronization/intersolve-visa-data-synchronization/intersolve-visa-data-synchronization.service';

@Module({
  imports: [IntersolveVisaAccountManagementModule],
  providers: [IntersolveVisaDataSynchronizationService],
  exports: [IntersolveVisaDataSynchronizationService],
})
export class IntersolveVisaDataSynchronizationModule {}
