import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../../user/user.module';
import { EventEntity } from '../entities/event.entity';
import { EventController } from '../events.controller';
import { EventGetService } from './events.get.service';

@Module({
  imports: [HttpModule, UserModule, TypeOrmModule.forFeature([EventEntity])],
  providers: [EventGetService],
  controllers: [EventController],
})
export class EventGetModule {}
