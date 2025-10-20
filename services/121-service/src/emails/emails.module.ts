import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { EmailsService } from '@121-service/src/emails/emails.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Module({
  imports: [HttpModule],
  providers: [EmailsService, CustomHttpService],
  controllers: [],
  exports: [EmailsService],
})
export class EmailsModule {}
