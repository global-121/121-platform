import { Module } from '@nestjs/common';

import { EmailsModule } from '@121-service/src/emails/emails.module';
import { UserEmailTemplatesModule } from '@121-service/src/user/user-emails/user-email-templates/user-email-templates.module';
import { UserEmailsService } from '@121-service/src/user/user-emails/user-emails.service';

@Module({
  imports: [UserEmailTemplatesModule, EmailsModule],
  providers: [UserEmailsService],
  controllers: [],
  exports: [UserEmailsService],
})
export class UserEmailsModule {}
