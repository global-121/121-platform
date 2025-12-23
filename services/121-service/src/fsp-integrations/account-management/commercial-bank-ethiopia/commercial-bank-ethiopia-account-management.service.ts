import { Inject, Injectable } from '@nestjs/common';
import { Equal } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { CommercialBankEthiopiaAccountEnquiriesEntity } from '@121-service/src/fsp-integrations/integrations/commercial-bank-ethiopia/commercial-bank-ethiopia-account-enquiries.entity';
import { CommercialBankEthiopiaValidationData } from '@121-service/src/fsp-integrations/integrations/commercial-bank-ethiopia/dto/commercial-bank-ethiopia-transfer-payload.dto';
import { CommercialBankEthiopiaApiService } from '@121-service/src/fsp-integrations/integrations/commercial-bank-ethiopia/services/commercial-bank-ethiopia.api.service';
import { CommercialBankEthiopiaService } from '@121-service/src/fsp-integrations/integrations/commercial-bank-ethiopia/services/commercial-bank-ethiopia.service';
import { FspAttributes } from '@121-service/src/fsp-integrations/shared/enum/fsp-attributes.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
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

    const getAllPersonsAffectedData =
      await this.getAllPersonsAffectedData(programId);

    const logMessageProgram = `CBE Reconciliation - Program: ${programId} - getValidationStatus total`;
    console.time(logMessageProgram);

    for (const pa of getAllPersonsAffectedData) {
      const logMessageRegistration = `CBE Reconciliation - Program: ${programId} - getValidationStatus for Registration: ${pa.id}`;
      console.time(logMessageRegistration);
      const paResult =
        await this.commercialBankEthiopiaApiService.getValidationStatus(
          pa.bankAccountNumber,
          credentials,
        );
      console.timeEnd(logMessageRegistration);

      const result = new CommercialBankEthiopiaAccountEnquiriesEntity();
      result.registrationId = pa?.id;
      result.fullNameUsedForTheMatch = pa?.fullName || null;
      result.bankAccountNumberUsedForCall = pa?.bankAccountNumber || null;
      result.cbeName = null;
      result.cbeStatus = null;
      result.errorMessage = null;

      if (paResult?.Status?.successIndicator?._text === 'Success') {
        const accountInfo =
          paResult?.EACCOUNTCBEREMITANCEType?.[
            'ns4:gEACCOUNTCBEREMITANCEDetailType'
          ]?.['ns4:mEACCOUNTCBEREMITANCEDetailType'];
        const cbeName = accountInfo?.['ns4:CUSTOMERNAME']?._text;
        const cbeStatus = accountInfo?.['ns4:ACCOUNTSTATUS']?._text;

        result.cbeName = cbeName || null;
        result.cbeStatus = cbeStatus || null;

        const hasFullName = Boolean(pa.fullName);
        const hasCbeName = Boolean(cbeName);

        if (hasFullName && hasCbeName) {
          result.errorMessage = null; // All infrormation is present so no error
        } else if (hasFullName && !hasCbeName) {
          result.errorMessage =
            'Did not get a name from CBE for account number';
        } else if (!hasFullName && hasCbeName) {
          result.errorMessage = 'FullName in 121 is missing';
        } else {
          result.errorMessage =
            'FullName in 121 is missing and did not get a name from CBE for account number';
        }
      } else {
        result.errorMessage =
          paResult.resultDescription ||
          (paResult.Status &&
            paResult.Status.messages &&
            (paResult.Status.messages.length > 0
              ? paResult.Status.messages[0]._text
              : paResult.Status.messages._text));
      }
      const existingRecord =
        await this.commercialBankEthiopiaAccountEnquiriesScopedRepo.findOne({
          where: { registrationId: Equal(pa.id) },
        });

      if (existingRecord) {
        await this.commercialBankEthiopiaAccountEnquiriesScopedRepo.updateUnscoped(
          { registrationId: pa.id },
          result as QueryDeepPartialEntity<CommercialBankEthiopiaAccountEnquiriesEntity>,
        );
      } else {
        await this.commercialBankEthiopiaAccountEnquiriesScopedRepo.save(
          result,
        );
      }
    }
    console.timeEnd(logMessageProgram);
    return getAllPersonsAffectedData.length;
  }

  public async getAllPersonsAffectedData(
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
