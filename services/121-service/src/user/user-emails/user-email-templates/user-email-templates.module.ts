import { Module } from '@nestjs/common';

import { UserEmailTemplatesService } from '@121-service/src/user/user-emails/user-email-templates/user-email-templates.service';

@Module({
  imports: [],
  providers: [UserEmailTemplatesService],
  controllers: [],
  exports: [UserEmailTemplatesService],
})
export class UserEmailTemplatesModule {}
