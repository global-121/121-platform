import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { KoboEntity } from '@121-service/src/kobo/entities/kobo.entity';
import { KoboWebhookBasicAuthGuard } from '@121-service/src/kobo/guards/kobo-webhook-basic-auth.guard';
import { KoboController } from '@121-service/src/kobo/kobo.controller';
import { KoboService } from '@121-service/src/kobo/services/kobo.service';
import { KoboValidationService } from '@121-service/src/kobo/services/kobo.validation.service';
import { KoboApiService } from '@121-service/src/kobo/services/kobo-api.service';
import { KoboSubmissionHelperService } from '@121-service/src/kobo/services/kobo-submission.helper.service';
import { KoboSubmissionService } from '@121-service/src/kobo/services/kobo-submission.service';
import { KoboSurveyProcessorService } from '@121-service/src/kobo/services/kobo-survey-processor.service';
import { ProgramFspConfigurationsModule } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.module';
import { ProgramRegistrationAttributesModule } from '@121-service/src/program-registration-attributes/program-registration-attributes.module';
import { ProgramModule } from '@121-service/src/programs/programs.module';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationsModule } from '@121-service/src/registration/registrations.module';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([KoboEntity, RegistrationEntity]),
    ProgramModule,
    ProgramRegistrationAttributesModule,
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
    KoboSubmissionHelperService,
    KoboWebhookBasicAuthGuard,
  ],
  controllers: [KoboController],
  exports: [],
})
export class KoboModule {}
