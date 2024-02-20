import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../../user/user.module';
import { createScopedRepositoryProvider } from '../../utils/scope/createScopedRepositoryProvider.helper';
import { EventEntity } from '../entities/event.entity';
import { EventController } from '../events.controller';
import { EventGetService } from './events.get.service';

@Module({
  imports: [HttpModule, UserModule, TypeOrmModule.forFeature([EventEntity])],
  providers: [EventGetService, createScopedRepositoryProvider(EventEntity)],
  controllers: [EventController],
  exports: [EventGetService],
})
export class EventGetModule {}
