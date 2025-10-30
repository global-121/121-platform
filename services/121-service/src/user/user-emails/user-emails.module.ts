import { Module } from '@nestjs/common';

import { EmailsModule } from '@121-service/src/emails/emails.module';
import { UserEmailsService } from '@121-service/src/user/user-emails/user-emails.service';

@Module({
  imports: [EmailsModule],
  providers: [UserEmailsService],
  controllers: [],
  exports: [UserEmailsService],
})
export class UserEmailsModule {}
