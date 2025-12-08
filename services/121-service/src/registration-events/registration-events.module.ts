import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RegistrationEventEntity } from '@121-service/src/registration-events/entities/registration-event.entity';
import { RegistrationEventViewEntity } from '@121-service/src/registration-events/entities/registration-event.view.entity';
import { RegistrationEventAttributeEntity } from '@121-service/src/registration-events/entities/registration-event-attribute.entity';
import { RegistrationEventsController } from '@121-service/src/registration-events/registration-events.controller';
import { RegistrationEventsService } from '@121-service/src/registration-events/registration-events.service';
import { RegistrationEventViewScopedRepository } from '@121-service/src/registration-events/repositories/registration-event.view.repository';
import { UserModule } from '@121-service/src/user/user.module';

@Module({
  imports: [
    HttpModule,
    UserModule,
    TypeOrmModule.forFeature([
      RegistrationEventEntity,
      RegistrationEventAttributeEntity,
      RegistrationEventViewEntity,
    ]),
  ],
  providers: [RegistrationEventsService, RegistrationEventViewScopedRepository],
  controllers: [RegistrationEventsController],
  exports: [RegistrationEventsService],
})
export class RegistrationEventsModule {}
