import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationsModule } from '../registration/registrations.module';
import { EspocrmWebhookEntity } from './espocrm-webhooks.entity';
import { EspocrmController } from './espocrm.controller';
import { EspocrmService } from './espocrm.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([EspocrmWebhookEntity]),
    RegistrationsModule,
  ],
  controllers: [EspocrmController],
  providers: [EspocrmService],
})
export class EspocrmModule {}
