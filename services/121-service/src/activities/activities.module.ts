import { Module } from '@nestjs/common';

import { ActivitiesController } from '@121-service/src/activities/activities.controller';
import { ActivitiesService } from '@121-service/src/activities/activities.service';
import { EventsModule } from '@121-service/src/events/events.module';
import { NoteModule } from '@121-service/src/notes/notes.module';
import { MessageModule } from '@121-service/src/notifications/message.module';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';

@Module({
  imports: [NoteModule, TransactionsModule, MessageModule, EventsModule],
  providers: [ActivitiesService],
  controllers: [ActivitiesController],
  exports: [],
})
export class ActivitiesModule {}
