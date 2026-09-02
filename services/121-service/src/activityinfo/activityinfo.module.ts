import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ActivityInfoController } from '@121-service/src/activityinfo/activityinfo.controller';
import { ActivityInfoEntity } from '@121-service/src/activityinfo/entities/activityinfo.entity';
import { ActivityInfoService } from '@121-service/src/activityinfo/services/activityinfo.service';
import { ActivityInfoValidationService } from '@121-service/src/activityinfo/services/activityinfo.validation.service';
import { ActivityInfoApiService } from '@121-service/src/activityinfo/services/activityinfo-api.service';
import { ActivityInfoFieldProcessorService } from '@121-service/src/activityinfo/services/activityinfo-field-processor.service';
import { ActivityInfoRecordHelperService } from '@121-service/src/activityinfo/services/activityinfo-record.helper.service';
import { ActivityInfoRecordService } from '@121-service/src/activityinfo/services/activityinfo-record.service';
import { ProgramFspConfigurationsModule } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.module';
import { ProgramRegistrationAttributesModule } from '@121-service/src/program-registration-attributes/program-registration-attributes.module';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';
import { ProgramModule } from '@121-service/src/programs/programs.module';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationsModule } from '@121-service/src/registration/registrations.module';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ActivityInfoEntity,
      ProgramRegistrationAttributeEntity,
      RegistrationEntity,
    ]),
    ProgramModule,
    ProgramRegistrationAttributesModule,
    ProgramFspConfigurationsModule,
    HttpModule,
    RegistrationsModule,
  ],
  providers: [
    ActivityInfoService,
    ActivityInfoApiService,
    ActivityInfoValidationService,
    ActivityInfoFieldProcessorService,
    ActivityInfoRecordService,
    ActivityInfoRecordHelperService,
    CustomHttpService,
  ],
  controllers: [ActivityInfoController],
  exports: [],
})
export class ActivityInfoModule {}
