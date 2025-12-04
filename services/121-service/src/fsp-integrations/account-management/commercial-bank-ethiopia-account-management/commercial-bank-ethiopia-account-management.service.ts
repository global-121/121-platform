import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { CommercialBankEthiopiaAccountEnquiriesEntity } from '@121-service/src/fsp-integrations/integrations/commercial-bank-ethiopia/commercial-bank-ethiopia-account-enquiries.entity';
import { CommercialBankEthiopiaValidationData } from '@121-service/src/fsp-integrations/integrations/commercial-bank-ethiopia/dto/commercial-bank-ethiopia-transfer-payload.dto';
import { CommercialBankEthiopiaApiService } from '@121-service/src/fsp-integrations/integrations/commercial-bank-ethiopia/services/commercial-bank-ethiopia.api.service';
import { CommercialBankEthiopiaService } from '@121-service/src/fsp-integrations/integrations/commercial-bank-ethiopia/services/commercial-bank-ethiopia.service';
import { FspAttributes } from '@121-service/src/fsp-management/enums/fsp-attributes.enum';
import { Fsps } from '@121-service/src/fsp-management/enums/fsp-name.enum';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { getScopedRepositoryProviderName } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

@Injectable()
export class CommercialBankEthiopiaReconciliationService {
  @InjectRepository(ProgramEntity)
  public programRepository: Repository<ProgramEntity>;
  @Inject(
    getScopedRepositoryProviderName(
      CommercialBankEthiopiaAccountEnquiriesEntity,
    ),
  )
  private readonly commercialBankEthiopiaAccountEnquiriesScopedRepo: ScopedRepository<CommercialBankEthiopiaAccountEnquiriesEntity>;

  public constructor(
    private readonly commercialBankEthiopiaService: CommercialBankEthiopiaService,
    private readonly commercialBankEthiopiaApiService: CommercialBankEthiopiaApiService,
    private readonly registrationScopedRepository: RegistrationScopedRepository,
  ) {}

  public async retrieveAndUpsertAccountEnquiries(): Promise<number> {
    const programs = await this.getAllProgramsWithCBE();
    let totalAccountEnquiries = 0;
    for (const program of programs) {
      const accountEnquiriesPerProgram =
        await this.retrieveAndUpsertAccountEnquiriesForProgram(program.id);
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

    console.time('getValidationStatus loop total');

    for (const pa of getAllPersonsAffectedData) {
      const logString = `getValidationStatus for PA: ${pa.id}`;
      console.time(logString);
      const paResult =
        await this.commercialBankEthiopiaApiService.getValidationStatus(
          pa.bankAccountNumber,
          credentials,
        );
      console.timeEnd(logString);

      const result = new CommercialBankEthiopiaAccountEnquiriesEntity();
      result.registrationId = pa?.id;
      result.fullNameUsedForTheMatch = pa?.fullName || null;
      result.bankAccountNumberUsedForCall = pa?.bankAccountNumber || null;
      result.cbeName = null;
      result.namesMatch = false;
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

        if (pa.fullName && cbeName) {
          result.namesMatch =
            pa.fullName.toUpperCase() === cbeName.toUpperCase();
        } else if (pa.fullName && !cbeName) {
          result.errorMessage =
            'Could not be matched: did not get a name from CBE for account number';
        } else if (cbeName && !pa.fullName) {
          result.errorMessage =
            'Could not be matched: fullName in 121 is missing';
        } else {
          result.errorMessage =
            'Could not be matched: fullName in 121 is missing and did not get a name from CBE for account number';
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
    console.timeEnd('getValidationStatus loop total');
    return getAllPersonsAffectedData.length;
  }

  public async getAllPersonsAffectedData(
    programId: number,
  ): Promise<CommercialBankEthiopiaValidationData[]> {
    const registrationData = await this.registrationScopedRepository
      .createQueryBuilder('registration')
      .select([
        'registration.id AS "id"',
        'ARRAY_AGG(data.value) AS "values"',
        'ARRAY_AGG("programRegistrationAttribute".name) AS "fieldNames"',
      ])
      .andWhere('registration.programId = :programId', { programId })
      .andWhere('(programRegistrationAttribute.name IN (:...names))', {
        names: [FspAttributes.fullName, FspAttributes.bankAccountNumber],
      })
      .andWhere('registration.registrationStatus NOT IN (:...statusValues)', {
        statusValues: ['deleted', 'paused'],
      })
      .leftJoin('registration.data', 'data')
      .leftJoin(
        'data.programRegistrationAttribute',
        'programRegistrationAttribute',
      )
      .groupBy('registration.id')
      .getRawMany();

    // Create a new array by mapping the original objects
    const formattedData: any = registrationData.map((pa) => {
      const paData = { id: pa.id };
      pa.fieldNames.forEach((fieldName: string, index: number) => {
        paData[fieldName] = pa.values[index];
      });
      return paData;
    });

    return formattedData;
  }
}
