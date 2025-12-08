import { Module } from '@nestjs/common';

import { IntersolveVisaDataSynchronizationService } from '@121-service/src/fsp-integrations/data-synchronization/intersolve-visa-data-synchronization/intersolve-visa-data-synchronization.service';
import { IntersolveVisaModule } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/intersolve-visa.module';

@Module({
  imports: [IntersolveVisaModule],
  providers: [IntersolveVisaDataSynchronizationService],
  exports: [IntersolveVisaDataSynchronizationService],
})
export class IntersolveVisaDataSynchronizationModule {}
