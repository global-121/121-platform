import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { KoboEntity } from '@121-service/src/kobo/entities/kobo.entity';
import { KoboController } from '@121-service/src/kobo/kobo.controller';
import { KoboService } from '@121-service/src/kobo/services/kobo.service';
import { KoboValidationService } from '@121-service/src/kobo/services/kobo.validation.service';
import { KoboApiService } from '@121-service/src/kobo/services/kobo-api.service';
import { KoboSubmissionService } from '@121-service/src/kobo/services/kobo-submission.service';
import { KoboSurveyProcessorService } from '@121-service/src/kobo/services/kobo-survey-processor.service';
import { ProgramFspConfigurationsModule } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.module';
import { ProgramModule } from '@121-service/src/programs/programs.module';
import { RegistrationsModule } from '@121-service/src/registration/registrations.module';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([KoboEntity]),
    ProgramModule,
    ProgramFspConfigurationsModule,
    HttpModule,
    RegistrationsModule,
  ],
  providers: [
    KoboService,
    KoboApiService,
    KoboValidationService,
    CustomHttpService,
    KoboSurveyProcessorService,
    KoboSubmissionService,
  ],
  controllers: [KoboController],
  exports: [],
})
export class KoboModule {}
