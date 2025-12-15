import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CooperativeBankOfOromiaAccountValidationReportRecordDto } from '@121-service/src/fsp-integrations/account-management/cooperative-bank-of-oromia-account-management/dtos/cooperative-bank-of-oromia-account-validation-report-record.dto';
import { CooperativeBankOfOromiaAccountValidationEntity } from '@121-service/src/fsp-integrations/account-management/cooperative-bank-of-oromia-account-management/entities/cooperative-bank-of-oromia-account-validation.entity';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';

export class CooperativeBankOfOromiaAccountValidationScopedRepository extends ScopedRepository<CooperativeBankOfOromiaAccountValidationEntity> {
  constructor(
    @Inject(REQUEST) request: ScopedUserRequest,
    @InjectRepository(CooperativeBankOfOromiaAccountValidationEntity)
    repository: Repository<CooperativeBankOfOromiaAccountValidationEntity>,
  ) {
    super(request, repository);
  }

  public async getAccountValidationReportRecords(
    programId: number,
  ): Promise<CooperativeBankOfOromiaAccountValidationReportRecordDto[]> {
    return this.createQueryBuilder('validation')
      .select([
        'validation.nameUsedForTheMatch as "nameUsedForTheMatch"',
        'validation.bankAccountNumberUsedForCall as "bankAccountNumberUsedForCall"',
        'validation.cooperativeBankOfOromiaName as "cooperativeBankOfOromiaName"',
        'validation.errorMessage as "errorMessage"',
        'registration.registrationProgramId as "registrationProgramId"',
        'registration.referenceId as "referenceId"',
        'validation.updated as "updated"',
      ])
      .leftJoin('validation.registration', 'registration')
      .andWhere(
        'registration."registrationStatus" IS DISTINCT FROM :deletedStatus',
        {
          deletedStatus: RegistrationStatusEnum.deleted, // The not opereator does not work with null values so we use IS DISTINCT FROM
        },
      )
      .andWhere('registration.programId = :programId', { programId })
      .getRawMany<CooperativeBankOfOromiaAccountValidationReportRecordDto>();
  }
}
