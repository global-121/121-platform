import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { EventAttributeEntity } from './entities/event-attribute.entity';
import { EventEntity } from './entities/event.entity';
import { EventsLogService } from './events-log.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventEntity, EventAttributeEntity]),
    UserModule,
  ],
  providers: [EventsLogService],
  controllers: [],
  exports: [EventsLogService],
})
export class EventsLogModule {}
