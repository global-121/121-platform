import { EmailsApiService } from '@121-service/src/emails/emails.api.service';
import { EmailsService } from '@121-service/src/emails/emails.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

@Module({
  imports: [HttpModule],
  providers: [EmailsService, CustomHttpService, EmailsApiService],
  controllers: [],
  exports: [EmailsService, EmailsApiService],
})
export class EmailsModule {}
