import { Module } from '@nestjs/common';

import { EmailsModule } from '@121-service/src/emails/emails.module';
import { RegistrationsUpdateJobEmailsService } from '@121-service/src/registrations-update-jobs/registrations-update-job-emails/registrations-update-job-emails.service';

@Module({
  imports: [EmailsModule],
  providers: [RegistrationsUpdateJobEmailsService],
  controllers: [],
  exports: [RegistrationsUpdateJobEmailsService],
})
export class RegistrationsUpdateJobEmailsModule {}
