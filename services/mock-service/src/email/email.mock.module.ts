import { Module } from '@nestjs/common';

import { EmailMockController } from '@mock-service/src/email/email.mock.controller';
import { EmailMockService } from '@mock-service/src/email/email.mock.service';

@Module({
  controllers: [EmailMockController],
  providers: [EmailMockService],
})
export class EmailMockModule {}
