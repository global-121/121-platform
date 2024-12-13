import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MessageQueuesService } from '@121-service/src/notifications/message-queues/message-queues.service';
import { MessageTemplateEntity } from '@121-service/src/notifications/message-template/message-template.entity';
import { ProgramAttributesModule } from '@121-service/src/program-attributes/program-attributes.module';
import { QueuesModule } from '@121-service/src/queues/queues.module';
import { RegistrationDataModule } from '@121-service/src/registration/modules/registration-data/registration-data.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MessageTemplateEntity]),
    ProgramAttributesModule,
    RegistrationDataModule,
    QueuesModule,
  ],
  providers: [MessageQueuesService],
  controllers: [],
  exports: [MessageQueuesService],
})
// TODO: REFACTOR: Rename to MessageQueuesModule
export class MessageQueuesModule {}
