import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationEntity } from '../registration/registration.entity';
import { RegistrationsService } from '../registration/registrations.service';
import { EspocrmController } from './espocrm.controller';
import { EspocrmService } from './espocrm.service';

@Module({
  imports: [TypeOrmModule.forFeature([RegistrationEntity])],
  controllers: [EspocrmController],
  providers: [EspocrmService, RegistrationsService],
})
export class EspocrmModule {}
