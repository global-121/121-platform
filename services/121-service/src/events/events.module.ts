import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EventEntity } from '@121-service/src/events/entities/event.entity';
import { EventAttributeEntity } from '@121-service/src/events/entities/event-attribute.entity';
import { EventScopedRepository } from '@121-service/src/events/event.repository';
import { EventsController } from '@121-service/src/events/events.controller';
import { EventsService } from '@121-service/src/events/events.service';
import { UserModule } from '@121-service/src/user/user.module';
import { createScopedRepositoryProvider } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

@Module({
  imports: [
    HttpModule,
    UserModule,
    TypeOrmModule.forFeature([EventEntity, EventAttributeEntity]),
  ],
  providers: [
    EventsService,
    EventScopedRepository,
    createScopedRepositoryProvider(EventEntity),
  ],
  controllers: [EventsController],
  exports: [EventsService, EventScopedRepository],
})
export class EventsModule {}
