import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { AlFouadApiHelperService } from '@121-service/src/fsp-integrations/integrations/al-fouad/services/al-fouad.api.helper.service';
import { AlFouadApiService } from '@121-service/src/fsp-integrations/integrations/al-fouad/services/al-fouad.api.service';
import { AlFouadEncryptionService } from '@121-service/src/fsp-integrations/integrations/al-fouad/services/al-fouad.encryption.service';
import { AlFouadService } from '@121-service/src/fsp-integrations/integrations/al-fouad/services/al-fouad.service';
import { TransactionEventsModule } from '@121-service/src/payments/transactions/transaction-events/transaction-events.module';
import { ProgramFspConfigurationsModule } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.module';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Module({
  imports: [
    HttpModule,
    ProgramFspConfigurationsModule,
    TransactionEventsModule,
  ],
  providers: [
    AlFouadService,
    AlFouadApiService,
    AlFouadApiHelperService,
    AlFouadEncryptionService,
    CustomHttpService,
  ],
  exports: [AlFouadService],
})
export class AlFouadModule {}
