import { Module } from '@nestjs/common';

import { EmailsModule } from '@121-service/src/emails/emails.module';
import { RegistrationsModule } from '@121-service/src/registration/registrations.module';
import { RegistrationsUpdateJobsProcessor } from '@121-service/src/registrations-update-jobs/processors/registrations-update-jobs.processor';
import { RegistrationsUpdateJobsService } from '@121-service/src/registrations-update-jobs/services/registrations-update-jobs.service';

@Module({
  imports: [RegistrationsModule, EmailsModule],
  providers: [RegistrationsUpdateJobsProcessor, RegistrationsUpdateJobsService],
})
export class RegistrationsUpdateJobsModule {}
