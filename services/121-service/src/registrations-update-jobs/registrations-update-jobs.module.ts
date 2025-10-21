import { Module } from '@nestjs/common';

import { RegistrationsModule } from '@121-service/src/registration/registrations.module';
import { RegistrationsUpdateJobsProcessor } from '@121-service/src/registrations-update-jobs/processors/registrations-update-jobs.processor';
import { RegistrationsUpdateJobsService } from '@121-service/src/registrations-update-jobs/services/registrations-update-jobs.service';
import { UserModule } from '@121-service/src/user/user.module';
import { UserEmailsModule } from '@121-service/src/user/user-emails/user-emails.module';

@Module({
  imports: [RegistrationsModule, UserEmailsModule, UserModule],
  providers: [RegistrationsUpdateJobsProcessor, RegistrationsUpdateJobsService],
})
export class RegistrationsUpdateJobsModule {}
