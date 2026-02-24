import { Inject, Injectable } from '@nestjs/common';
import { Equal } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { CommercialBankEthiopiaAccountEnquiriesEntity } from '@121-service/src/fsp-integrations/integrations/commercial-bank-ethiopia/commercial-bank-ethiopia-account-enquiries.entity';
import { CommercialBankEthiopiaValidationData } from '@121-service/src/fsp-integrations/integrations/commercial-bank-ethiopia/dto/commercial-bank-ethiopia-transfer-payload.dto';
import { CommercialBankEthiopiaApiService } from '@121-service/src/fsp-integrations/integrations/commercial-bank-ethiopia/services/commercial-bank-ethiopia.api.service';
import { CommercialBankEthiopiaService } from '@121-service/src/fsp-integrations/integrations/commercial-bank-ethiopia/services/commercial-bank-ethiopia.service';
import { FspAttributes } from '@121-service/src/fsp-integrations/shared/enum/fsp-attributes.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { RequiredUsernamePasswordInterface } from '@121-service/src/program-fsp-configurations/interfaces/required-username-password.interface';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { getScopedRepositoryProviderName } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

@Injectable()
export class CommercialBankEthiopiaAccountManagementService {
  @Inject(
    getScopedRepositoryProviderName(
      CommercialBankEthiopiaAccountEnquiriesEntity,
    ),
  )
  private readonly commercialBankEthiopiaAccountEnquiriesScopedRepo: ScopedRepository<CommercialBankEthiopiaAccountEnquiriesEntity>;

  public constructor(
    private readonly programRepository: ProgramRepository,
    private readonly commercialBankEthiopiaService: CommercialBankEthiopiaService,
    private readonly commercialBankEthiopiaApiService: CommercialBankEthiopiaApiService,
    private readonly registrationViewScopedRepository: RegistrationViewScopedRepository,
    private readonly registrationsPaginationService: RegistrationsPaginationService,
  ) {}

  public async retrieveAndUpsertAccountEnquiries(): Promise<number> {
    const programIds = await this.programRepository.getAllProgramIdsWithFsp(
      Fsps.commercialBankEthiopia,
    );
    let totalAccountEnquiries = 0;
    for (const programId of programIds) {
      const accountEnquiriesPerProgram =
        await this.retrieveAndUpsertAccountEnquiriesForProgram(programId);
      totalAccountEnquiries += accountEnquiriesPerProgram;
    }
    return totalAccountEnquiries;
  }

  public async getAllProgramsWithCBE(): Promise<ProgramEntity[]> {
    const programs = await this.programRepository
      .createQueryBuilder('program')
      .select('program.id')
      .innerJoin('program.programFspConfigurations', 'programFspConfigurations')
      .where('programFspConfigurations.fspName = :fsp', {
        fsp: Fsps.commercialBankEthiopia,
      })
      .getMany();

    return programs;
  }

  public async retrieveAndUpsertAccountEnquiriesForProgram(
    programId: number,
  ): Promise<number> {
    const credentials =
      await this.commercialBankEthiopiaService.getCommercialBankEthiopiaCredentialsOrThrow(
        { programId },
      );

    const registrationsWithCbe = await this.getAllRegistrationData(programId);

    const logMessageProgram = `CBE Reconciliation - Program: ${programId} - getValidationStatus total`;
    console.time(logMessageProgram);

    for (const registration of registrationsWithCbe) {
      await this.retrieveAndUpsertAccountEnqueryPerRegistration({
        registration,
        credentials,
        programId,
      });
    }
    console.timeEnd(logMessageProgram);
    return registrationsWithCbe.length;
  }

  private async retrieveAndUpsertAccountEnqueryPerRegistration({
    registration,
    credentials,
    programId,
  }: {
    registration: CommercialBankEthiopiaValidationData;
    credentials: RequiredUsernamePasswordInterface;
    programId: number;
  }) {
    const logMessageRegistration = `CBE Reconciliation - Program: ${programId} - getValidationStatus for Registration: ${registration.id}`;
    console.time(logMessageRegistration);
    let validationResult;
    try {
      validationResult =
        await this.commercialBankEthiopiaApiService.getValidationStatus(
          registration.bankAccountNumber,
          credentials,
        );
    } catch (error) {
      // We made a generic try catch here because we do not want the entire reconciliation process to fail if the API call for one registration fails. By catching the error and logging it, we can still get validation results for other registrations and have a record of which ones failed for further investigation.
      console.error(
        `Error fetching validation status for Registration ID ${registration.id} with account number ${registration.bankAccountNumber}:`,
        error,
      );
      console.timeEnd(logMessageRegistration);
      return;
    }
    console.timeEnd(logMessageRegistration);

    const result = new CommercialBankEthiopiaAccountEnquiriesEntity();
    result.registrationId = registration?.id;
    result.fullNameUsedForTheMatch = registration?.fullName || null;
    result.bankAccountNumberUsedForCall =
      registration?.bankAccountNumber || null;
    result.cbeName = null;
    result.cbeStatus = null;
    result.errorMessage = null;

    if (validationResult?.Status?.successIndicator?._text === 'Success') {
      const accountInfo =
        validationResult?.EACCOUNTCBEREMITANCEType?.[
          'ns4:gEACCOUNTCBEREMITANCEDetailType'
        ]?.['ns4:mEACCOUNTCBEREMITANCEDetailType'];
      const cbeName = accountInfo?.['ns4:CUSTOMERNAME']?._text;
      const cbeStatus = accountInfo?.['ns4:ACCOUNTSTATUS']?._text;

      result.cbeName = cbeName || null;
      result.cbeStatus = cbeStatus || null;

      const hasFullName = Boolean(registration.fullName);
      const hasCbeName = Boolean(cbeName);

      if (hasFullName && hasCbeName) {
        result.errorMessage = null; // All infrormation is present so no error
      } else if (hasFullName && !hasCbeName) {
        result.errorMessage = 'Did not get a name from CBE for account number';
      } else if (!hasFullName && hasCbeName) {
        result.errorMessage = 'FullName in 121 is missing';
      } else {
        result.errorMessage =
          'FullName in 121 is missing and did not get a name from CBE for account number';
      }
    } else {
      result.errorMessage =
        validationResult.resultDescription ||
        (validationResult.Status &&
          validationResult.Status.messages &&
          (validationResult.Status.messages.length > 0
            ? validationResult.Status.messages[0]._text
            : validationResult.Status.messages._text));
    }
    const existingRecord =
      await this.commercialBankEthiopiaAccountEnquiriesScopedRepo.findOne({
        where: { registrationId: Equal(registration.id) },
      });

    if (existingRecord) {
      await this.commercialBankEthiopiaAccountEnquiriesScopedRepo.updateUnscoped(
        { registrationId: registration.id },
        result as QueryDeepPartialEntity<CommercialBankEthiopiaAccountEnquiriesEntity>,
      );
    } else {
      await this.commercialBankEthiopiaAccountEnquiriesScopedRepo.save(result);
    }
  }

  public async getAllRegistrationData(
    programId: number,
  ): Promise<CommercialBankEthiopiaValidationData[]> {
    const queryBuilderCbeRegistrations =
      this.registrationViewScopedRepository.getQueryBuilderFilterByFsp({
        programId,
        fspNames: [Fsps.commercialBankEthiopia],
      });
    const queryBuilderReportRegistrations =
      queryBuilderCbeRegistrations.andWhere(
        'registration.status IS DISTINCT FROM :pausedStatus',
        {
          pausedStatus: RegistrationStatusEnum.paused, // The NOT-operator does not work with null values so we use IS DISTINCT FROM
        },
      );
    const registrationsWithCBE =
      await this.registrationsPaginationService.getRegistrationViewsNoLimit({
        programId,
        paginateQuery: {
          path: '',
          select: [
            'id',
            FspAttributes.fullName,
            FspAttributes.bankAccountNumber,
          ],
        },
        queryBuilder: queryBuilderReportRegistrations,
      });

    return registrationsWithCBE.map((registration) => ({
      id: registration.id,
      fullName: registration[FspAttributes.fullName],
      bankAccountNumber: registration[FspAttributes.bankAccountNumber],
    }));
  }
}
