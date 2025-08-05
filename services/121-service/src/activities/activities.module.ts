import { Module } from '@nestjs/common';

import { ActivitiesController } from '@121-service/src/activities/activities.controller';
import { ActivitiesService } from '@121-service/src/activities/activities.service';
import { NoteModule } from '@121-service/src/notes/notes.module';
import { MessageModule } from '@121-service/src/notifications/message.module';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { RegistrationEventsModule } from '@121-service/src/registration-events/registration-events.module';
import { UserModule } from '@121-service/src/user/user.module';

@Module({
  imports: [
    NoteModule,
    TransactionsModule,
    MessageModule,
    RegistrationEventsModule,
    UserModule,
  ],
  providers: [ActivitiesService],
  controllers: [ActivitiesController],
  exports: [],
})
export class ActivitiesModule {}
