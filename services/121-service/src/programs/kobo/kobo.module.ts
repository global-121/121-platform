import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { KoboEntity } from '@121-service/src/programs/kobo/enitities/kobo.entity';
import { KoboController } from '@121-service/src/programs/kobo/kobo.controller';
import { KoboService } from '@121-service/src/programs/kobo/kobo.service';
import { KoboApiService } from '@121-service/src/programs/kobo/kobo-api-service';
import { KoboSurveyService } from '@121-service/src/programs/kobo/kobo-survey.service';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/program-registration-attribute.entity';
import { ProgramModule } from '@121-service/src/programs/programs.module';
import { RegistrationsModule } from '@121-service/src/registration/registrations.module';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      KoboEntity,
      ProgramEntity,
      ProgramRegistrationAttributeEntity,
    ]),
    HttpModule,
    ProgramModule,
    RegistrationsModule,
  ],
  providers: [
    KoboService,
    KoboApiService,
    KoboSurveyService,
    CustomHttpService,
  ],
  controllers: [KoboController],
  exports: [KoboService],
})
export class KoboModule {}
