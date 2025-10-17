import { Module } from '@nestjs/common';

import { UserEmailTemplatesModule } from '@121-service/src/user/user-emails/user-email-templates/user-email-templates.module';
import { UserEmailsService } from '@121-service/src/user/user-emails/user-emails.service';

@Module({
  imports: [UserEmailTemplatesModule],
  providers: [UserEmailsService],
  controllers: [],
  exports: [UserEmailsService],
})
export class UserEmailsModule {}
