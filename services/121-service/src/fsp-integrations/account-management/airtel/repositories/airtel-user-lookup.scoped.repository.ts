import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AirtelUserLookupReportRecordDto } from '@121-service/src/fsp-integrations/account-management/airtel/dtos/airtel-user-lookup-report-record.dto';
import { AirtelUserLookupEntity } from '@121-service/src/fsp-integrations/account-management/airtel/entities/airtel-user-lookup.entity';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';

export class AirtelUserLookupScopedRepository extends ScopedRepository<AirtelUserLookupEntity> {
  constructor(
    @Inject(REQUEST) request: ScopedUserRequest,
    @InjectRepository(AirtelUserLookupEntity)
    repository: Repository<AirtelUserLookupEntity>,
  ) {
    super(request, repository);
  }

  public async getUserLookupReportRecords(
    programId: number,
  ): Promise<AirtelUserLookupReportRecordDto[]> {
    return this.createQueryBuilder('lookup')
      .select([
        'lookup.phoneNumberUsedForCall as "phoneNumberUsedForCall"',
        'lookup.nameUsedForTheMatch as "nameUsedForTheMatch"',
        'lookup.isAirtelUser as "isAirtelUser"',
        'lookup.airtelName as "airtelName"',
        'lookup.errorMessage as "errorMessage"',
        'registration.registrationProgramId as "registrationProgramId"',
        'registration.referenceId as "referenceId"',
        'lookup.updated as "updated"',
      ])
      .leftJoin('lookup.registration', 'registration')
      .andWhere(
        'registration."registrationStatus" IS DISTINCT FROM :deletedStatus',
        {
          deletedStatus: RegistrationStatusEnum.deleted,
        },
      )
      .andWhere('registration.programId = :programId', { programId })
      .getRawMany<AirtelUserLookupReportRecordDto>();
  }
}
