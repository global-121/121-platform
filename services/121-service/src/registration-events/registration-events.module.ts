import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RegistrationEventEntity } from '@121-service/src/registration-events/entities/registration-event.entity';
import { RegistrationEventAttributeEntity } from '@121-service/src/registration-events/entities/registration-event-attribute.entity';
import { RegistrationEventScopedRepository } from '@121-service/src/registration-events/registration-event.repository';
import { RegistrationEventsController } from '@121-service/src/registration-events/registration-events.controller';
import { RegistrationEventsService } from '@121-service/src/registration-events/registration-events.service';
import { UserModule } from '@121-service/src/user/user.module';
import { createScopedRepositoryProvider } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

@Module({
  imports: [
    HttpModule,
    UserModule,
    TypeOrmModule.forFeature([
      RegistrationEventEntity,
      RegistrationEventAttributeEntity,
    ]),
  ],
  providers: [
    RegistrationEventsService,
    RegistrationEventScopedRepository,
    createScopedRepositoryProvider(RegistrationEventEntity),
  ],
  controllers: [RegistrationEventsController],
  exports: [RegistrationEventsService, RegistrationEventScopedRepository],
})
export class RegistrationEventsModule {}
