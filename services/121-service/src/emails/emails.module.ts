import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { EmailsApiService } from '@121-service/src/emails/services/emails.api.service';
import { EmailsService } from '@121-service/src/emails/services/emails.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Module({
  imports: [HttpModule],
  providers: [EmailsService, CustomHttpService, EmailsApiService],
  controllers: [],
  exports: [EmailsService, EmailsApiService],
})
export class EmailsModule {}
