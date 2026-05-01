import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { AzureGraphTokenService } from '@121-service/src/emails/azure-graph-token.service';
import { EmailsService } from '@121-service/src/emails/emails.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Module({
  imports: [HttpModule],
  providers: [EmailsService, AzureGraphTokenService, CustomHttpService],
  controllers: [],
  exports: [EmailsService],
})
export class EmailsModule {}
