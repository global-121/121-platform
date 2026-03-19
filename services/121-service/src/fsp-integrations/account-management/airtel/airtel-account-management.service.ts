import { Injectable } from '@nestjs/common';
import { Equal } from 'typeorm';

import { AirtelUserLookupReportDto } from '@121-service/src/fsp-integrations/account-management/airtel/dtos/airtel-user-lookup-report.dto';
import { AirtelUserLookupEntity } from '@121-service/src/fsp-integrations/account-management/airtel/entities/airtel-user-lookup.entity';
import { AirtelUserLookupScopedRepository } from '@121-service/src/fsp-integrations/account-management/airtel/repositories/airtel-user-lookup.scoped.repository';
import { AirtelApiService } from '@121-service/src/fsp-integrations/integrations/airtel/services/airtel.api.service';
import { FspAttributes } from '@121-service/src/fsp-integrations/shared/enum/fsp-attributes.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';

@Injectable()
export class AirtelAccountManagementService {
  public constructor(
    private readonly airtelUserLookupScopedRepository: AirtelUserLookupScopedRepository,
    private readonly airtelApiService: AirtelApiService,
    private readonly registrationViewScopedRepository: RegistrationViewScopedRepository,
    private readonly registrationsPaginationService: RegistrationsPaginationService,
    private readonly programRepository: ProgramRepository,
  ) {}

  public async retrieveAndUpsertUserLookups(): Promise<number> {
    const programIds = await this.programRepository.getAllProgramIdsWithFsp(
      Fsps.airtel,
    );
    let totalUserLookups = 0;
    for (const programId of programIds) {
      const userLookupsPerProgram =
        await this.retrieveAndUpsertUserLookupsForProgram({ programId });
      totalUserLookups += userLookupsPerProgram;
    }
    return totalUserLookups;
  }

  public async retrieveAndUpsertUserLookupsForProgram({
    programId,
  }: {
    programId: number;
  }): Promise<number> {
    const queryBuilder =
      this.registrationViewScopedRepository.getQueryBuilderFilterByFsp({
        programId,
        fspNames: [Fsps.airtel],
      });
    const registrationsWithAirtel =
      await this.registrationsPaginationService.getRegistrationViewsNoLimit({
        programId,
        paginateQuery: {
          path: '',
          select: ['id', FspAttributes.fullName, FspAttributes.phoneNumber],
        },
        queryBuilder,
      });

    const logMessageProgram = `Airtel user lookup - Program: ${programId} - getUserInformation total`;
    console.time(logMessageProgram);

    for (const registration of registrationsWithAirtel) {
      await this.retrieveAndUpsertUserLookupPerRegistration({
        registrationId: registration.id,
        fullName: registration[FspAttributes.fullName] ?? null,
        phoneNumber: registration[FspAttributes.phoneNumber] ?? null,
        programId,
      });
    }
    console.timeEnd(logMessageProgram);

    return registrationsWithAirtel.length;
  }

  private async retrieveAndUpsertUserLookupPerRegistration({
    registrationId,
    fullName,
    phoneNumber,
    programId,
  }: {
    registrationId: number;
    fullName: string | null;
    phoneNumber: string | null;
    programId: number;
  }): Promise<void> {
    const logMessageRegistration = `Airtel user lookup - Program: ${programId} - getUserInformation for Registration: ${registrationId}`;
    console.time(logMessageRegistration);

    const entityToSave = new AirtelUserLookupEntity();
    entityToSave.registrationId = registrationId;
    entityToSave.nameUsedForTheMatch = fullName;
    entityToSave.phoneNumberUsedForCall = phoneNumber;
    entityToSave.isAirtelUser = null;
    entityToSave.airtelName = null;
    entityToSave.errorMessage = null;

    if (!phoneNumber) {
      entityToSave.errorMessage = 'Phone number is missing';
    } else {
      const zambianCountryCode = '260';
      const phoneNumberWithoutCountryCode = phoneNumber.startsWith(
        zambianCountryCode,
      )
        ? phoneNumber.slice(zambianCountryCode.length)
        : phoneNumber;

      try {
        const { isAirtelUser, airtelName, errorMessage } =
          await this.airtelApiService.getUserInformation({
            phoneNumberWithoutCountryCode,
          });
        entityToSave.isAirtelUser = isAirtelUser;
        entityToSave.airtelName = airtelName;
        entityToSave.errorMessage = errorMessage;
      } catch (error) {
        // We do not want the entire lookup process to fail if the API call for one registration fails.
        console.error(
          `Error fetching user information for Registration ID ${registrationId} with phone number ${phoneNumber}:`,
          error,
        );
        entityToSave.errorMessage = `User lookup failed: ${error?.message ?? 'Unknown error'}`;
      }
    }
    console.timeEnd(logMessageRegistration);

    const existingRecord =
      await this.airtelUserLookupScopedRepository.findOne({
        where: { registrationId: Equal(registrationId) },
      });

    if (existingRecord) {
      existingRecord.phoneNumberUsedForCall = entityToSave.phoneNumberUsedForCall;
      existingRecord.nameUsedForTheMatch = entityToSave.nameUsedForTheMatch;
      existingRecord.isAirtelUser = entityToSave.isAirtelUser;
      existingRecord.airtelName = entityToSave.airtelName;
      existingRecord.errorMessage = entityToSave.errorMessage;
      await this.airtelUserLookupScopedRepository.save(existingRecord);
    } else {
      await this.airtelUserLookupScopedRepository.save(entityToSave);
    }
  }

  public async getUserLookupReport({
    programId,
  }: {
    programId: number;
  }): Promise<AirtelUserLookupReportDto> {
    const data =
      await this.airtelUserLookupScopedRepository.getUserLookupReportRecords(
        programId,
      );
    return { data, fileName: 'airtel-user-lookup-report' };
  }
}
