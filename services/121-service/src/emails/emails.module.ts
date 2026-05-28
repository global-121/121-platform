import { Module } from '@nestjs/common';

import { EmailsService } from '@121-service/src/emails/emails.service';
import { GraphModule } from '@121-service/src/emails/graph/graph.module';

@Module({
  imports: [GraphModule],
  providers: [EmailsService],
  controllers: [],
  exports: [EmailsService],
})
export class EmailsModule {}
