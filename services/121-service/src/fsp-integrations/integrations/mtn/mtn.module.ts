import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { MtnController } from '@121-service/src/fsp-integrations/integrations/mtn/mtn.controller';
import { MtnApiKeyHelperService } from '@121-service/src/fsp-integrations/integrations/mtn/services/mtn.api.key.helper.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Module({
  imports: [HttpModule],
  controllers: [MtnController],
  providers: [MtnApiKeyHelperService, CustomHttpService],
  exports: [MtnApiKeyHelperService],
})
export class MtnModule {}
