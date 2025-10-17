import { Module } from '@nestjs/common';

import { UserEmailsService } from '@121-service/src/user/modules/user-emails/user-emails.service';

@Module({
  imports: [],
  providers: [UserEmailsService],
  controllers: [],
  exports: [UserEmailsService],
})
export class UserEmailsModule {}
