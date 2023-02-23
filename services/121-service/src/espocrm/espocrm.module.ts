import { Module } from '@nestjs/common';
import { RegistrationsModule } from '../registration/registrations.module';
import { EspocrmController } from './espocrm.controller';
import { EspocrmService } from './espocrm.service';

@Module({
  imports: [RegistrationsModule],
  controllers: [EspocrmController],
  providers: [EspocrmService],
})
export class EspocrmModule {}
