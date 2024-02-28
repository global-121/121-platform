import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { createScopedRepositoryProvider } from '../utils/scope/createScopedRepositoryProvider.helper';
import { EventAttributeEntity } from './entities/event-attribute.entity';
import { EventEntity } from './entities/event.entity';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [
    HttpModule,
    UserModule,
    TypeOrmModule.forFeature([EventEntity, EventAttributeEntity]),
  ],
  providers: [EventsService, createScopedRepositoryProvider(EventEntity)],
  controllers: [EventsController],
  exports: [EventsService],
})
export class EventsModule {}
