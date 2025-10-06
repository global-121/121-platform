import { Module } from '@nestjs/common';

import { EmailsModule } from '@121-service/src/emails/emails.module';
import { RegistrationsModule } from '@121-service/src/registration/registrations.module';

@Module({
  imports: [RegistrationsModule, EmailsModule],
  providers: [],
})
export class RegistrationsUpdateJobsModule {}
