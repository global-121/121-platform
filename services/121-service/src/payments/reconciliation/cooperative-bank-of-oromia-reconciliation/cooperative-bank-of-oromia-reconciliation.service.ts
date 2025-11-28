import { Injectable } from '@nestjs/common';
import { Equal } from 'typeorm/find-options/operator/Equal.js';

import { FspAttributes } from '@121-service/src/fsps/enums/fsp-attributes.enum';
import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { CooperativeBankOfOromiaService } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/services/cooperative-bank-of-oromia.service';
import { CooperativeBankOfOromiaAccountValidationReportDto } from '@121-service/src/payments/reconciliation/cooperative-bank-of-oromia-reconciliation/dtos/cooperative-bank-of-oromia-account-validation-report.dto';
import { CooperativeBankOfOromiaAccountValidationEntity } from '@121-service/src/payments/reconciliation/cooperative-bank-of-oromia-reconciliation/entities/cooperative-bank-of-oromia-account-validation.entity';
import { CooperativeBankOfOromiaAccountValidationScopedRepository } from '@121-service/src/payments/reconciliation/cooperative-bank-of-oromia-reconciliation/repositories/cooperative-bank-of-oromia-account-validation.scoped.repository';
import { MappedPaginatedRegistrationDto } from '@121-service/src/registration/dto/mapped-paginated-registration.dto';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';

@Injectable()
export class CooperativeBankOfOromiaReconciliationService {
  constructor(
    private readonly cooperativeBankOfOromiaAccountValidationScopedRepository: CooperativeBankOfOromiaAccountValidationScopedRepository,
    private readonly registrationViewScopedRepository: RegistrationViewScopedRepository,
    private readonly registrationsPaginationService: RegistrationsPaginationService,
    private readonly cooperativeBankOfOromiaService: CooperativeBankOfOromiaService,
  ) {}

  public async retrieveAndUpsertAccountValidationsForProgram(
    programId: number,
  ): Promise<number> {
    const queryBuilder =
      this.registrationViewScopedRepository.getQueryBuilderFilterByFsp({
        programId,
        fspName: Fsps.cooperativeBankOfOromia,
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
    const namesMatch = this.doTheNamesMatch(
      registration[FspAttributes.fullName]!,
      accountInformation.cooperativeBankOfOromiaName,
    );

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

  private doTheNamesMatch(
    registrationName: string,
    bankName?: string,
  ): boolean | null {
    if (!bankName) {
      return false;
    }
    return registrationName.toUpperCase() === bankName.toUpperCase();
  }

  public async getAccountValidationReport(
    programId: number,
  ): Promise<CooperativeBankOfOromiaAccountValidationReportDto> {
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
