import { Module } from '@nestjs/common';

import { EmailsModule } from '@121-service/src/emails/emails.module';
import { RegistrationsModule } from '@121-service/src/registration/registrations.module';
import { RegistrationsUpdateJobsProcessor } from '@121-service/src/registrations-update-jobs/processors/registrations-update-jobs.processor';
import { RegistrationsUpdateJobEmailsModule } from '@121-service/src/registrations-update-jobs/registrations-update-job-emails/registrations-update-job-emails.module';
import { RegistrationsUpdateJobsService } from '@121-service/src/registrations-update-jobs/registrations-update-jobs.service';
import { UserModule } from '@121-service/src/user/user.module';

@Module({
  imports: [
    RegistrationsModule,
    UserModule,
    EmailsModule,
    RegistrationsUpdateJobEmailsModule,
  ],
  providers: [RegistrationsUpdateJobsProcessor, RegistrationsUpdateJobsService],
})
export class RegistrationsUpdateJobsModule {}
