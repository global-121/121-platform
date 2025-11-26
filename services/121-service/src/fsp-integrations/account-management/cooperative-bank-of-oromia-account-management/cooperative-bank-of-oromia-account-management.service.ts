import { Injectable } from '@nestjs/common';
import { Equal } from 'typeorm/find-options/operator/Equal.js';

import { CooperativeBankOfOromiaAccountValidationReportDto } from '@121-service/src/fsp-integrations/account-management/cooperative-bank-of-oromia-account-management/dtos/cooperative-bank-of-oromia-account-validation-report.dto';
import { CooperativeBankOfOromiaAccountValidationEntity } from '@121-service/src/fsp-integrations/account-management/cooperative-bank-of-oromia-account-management/entities/cooperative-bank-of-oromia-account-validation.entity';
import { CooperativeBankOfOromiaAccountValidationScopedRepository } from '@121-service/src/fsp-integrations/account-management/cooperative-bank-of-oromia-account-management/repositories/cooperative-bank-of-oromia-account-validation.scoped.repository';
import { CooperativeBankOfOromiaService } from '@121-service/src/fsp-integrations/integrations/cooperative-bank-of-oromia/services/cooperative-bank-of-oromia.service';
import { FspAttributes } from '@121-service/src/fsp-management/enums/fsp-attributes.enum';
import { Fsps } from '@121-service/src/fsp-management/enums/fsp-name.enum';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { MappedPaginatedRegistrationDto } from '@121-service/src/registration/dto/mapped-paginated-registration.dto';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';

@Injectable()
export class CooperativeBankOfOromiaAccountManagementService {
  constructor(
    private readonly cooperativeBankOfOromiaAccountValidationScopedRepository: CooperativeBankOfOromiaAccountValidationScopedRepository,
    private readonly registrationViewScopedRepository: RegistrationViewScopedRepository,
    private readonly registrationsPaginationService: RegistrationsPaginationService,
    private readonly cooperativeBankOfOromiaService: CooperativeBankOfOromiaService,
    private readonly programRepository: ProgramRepository,
  ) {}

  public async retrieveAndUpsertAccountInformation(): Promise<number> {
    const programIds = await this.programRepository.getAllProgramIdsWithFsp(
      Fsps.cooperativeBankOfOromia,
    );
    let totalAccounts = 0;
    for (const programId of programIds) {
      const totalAccountsPerProgram =
        await this.retrieveAndUpsertAccountInformationForProgram({ programId });
      totalAccounts += totalAccountsPerProgram;
    }
    return totalAccounts;
  }

  public async retrieveAndUpsertAccountInformationForProgram({
    programId,
  }: {
    programId: number;
  }): Promise<number> {
    const queryBuilder =
      this.registrationViewScopedRepository.getQueryBuilderFilterByFsp({
        programId,
        fspNames: [Fsps.cooperativeBankOfOromia],
      });
    const registrationsWithCoopBank =
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
        queryBuilder,
      });
    for (const registration of registrationsWithCoopBank) {
      const accountInformation =
        await this.cooperativeBankOfOromiaService.getAccountInformation(
          registration[FspAttributes.bankAccountNumber]!, // all registrations with coop bank have account number
        );
      await this.storeAccountValidationResult(registration, accountInformation);
    }

    return registrationsWithCoopBank.length;
  }

  private async storeAccountValidationResult(
    registration: MappedPaginatedRegistrationDto,
    accountInformation: {
      cooperativeBankOfOromiaName?: string;
      errorMessage?: string;
    },
  ): Promise<void> {
    const namesMatch = this.doTheNamesMatch({
      registrationName: registration[FspAttributes.fullName]!, // full name is always present for registrations with coop bank as it required in FSP settings
      cooperativeBankOfOromiaName:
        accountInformation.cooperativeBankOfOromiaName,
    });

    const existingEntity =
      await this.cooperativeBankOfOromiaAccountValidationScopedRepository.findOne(
        {
          where: { registrationId: Equal(registration.id) },
        },
      );

    let entityToSave: CooperativeBankOfOromiaAccountValidationEntity;
    if (existingEntity) {
      entityToSave = existingEntity;
    } else {
      entityToSave = new CooperativeBankOfOromiaAccountValidationEntity();
    }
    entityToSave.registrationId = registration.id;
    entityToSave.bankAccountNumberUsedForCall =
      registration[FspAttributes.bankAccountNumber]!;
    entityToSave.nameUsedForTheMatch = registration[FspAttributes.fullName]!;
    entityToSave.cooperativeBankOfOromiaName =
      accountInformation.cooperativeBankOfOromiaName || null;
    entityToSave.namesMatch = namesMatch;
    entityToSave.errorMessage = accountInformation.errorMessage || null;

    await this.cooperativeBankOfOromiaAccountValidationScopedRepository.save(
      entityToSave,
    );
  }

  private doTheNamesMatch({
    registrationName,
    cooperativeBankOfOromiaName,
  }: {
    registrationName: string;
    cooperativeBankOfOromiaName?: string;
  }): boolean {
    if (!cooperativeBankOfOromiaName) {
      return false;
    }
    return (
      registrationName.toUpperCase() ===
      cooperativeBankOfOromiaName.toUpperCase()
    );
  }

  public async getAccountValidationReport({
    programId,
  }: {
    programId: number;
  }): Promise<CooperativeBankOfOromiaAccountValidationReportDto> {
    const data =
      await this.cooperativeBankOfOromiaAccountValidationScopedRepository.getAccountValidationReportRecords(
        programId,
      );
    return {
      data,
      fileName: `cooperative-bank-of-oromia-account-validations-report`,
    };
  }
}
