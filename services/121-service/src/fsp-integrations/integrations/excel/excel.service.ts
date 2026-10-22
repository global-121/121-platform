import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import {
  ExcelFspInstructions
} from '@121-service/src/fsp-integrations/integrations/excel/dto/excel-fsp-instructions.dto';
import { TransactionEntity } from '@121-service/src/payments/transactions/entities/transaction.entity';
import {
  ExcelFspConfigurationRepository
} from '@121-service/src/program-fsp-configurations/excel/repositories/excel-fsp-configuration.repository';
import { GenericRegistrationAttributes } from '@121-service/src/registration/enum/registration-attribute.enum';
import {
  RegistrationsPaginationService
} from '@121-service/src/registration/services/registrations-pagination.service';

@Injectable()
export class ExcelService {
  public constructor(
    //TODO: This should be refactored to not use the registrationPaginationService, maybe this entire service/module should be deleted and moved to the PaymentsExcelFspService
    private readonly registrationsPaginationService: RegistrationsPaginationService,
    private readonly excelFspConfigurationRepository: ExcelFspConfigurationRepository,
  ) {}

  public async getFspInstructions({
    transactions,
    programId,
    programFspConfigurationId,
  }: {
    transactions: TransactionEntity[];
    programId: number;
    programFspConfigurationId: number;
  }): Promise<ExcelFspInstructions[]> {
    const configuredExportColumns = await this.getExportFieldsForConfiguration(
      programFspConfigurationId,
    );
    const matchColumn = await this.getImportMatchColumn(
      programFspConfigurationId,
    );
    const exportColumns = [
      ...new Set([...configuredExportColumns, matchColumn]),
    ];
    const referenceIds = transactions.map((t) => t.registration.referenceId);

    const registrations =
      await this.registrationsPaginationService.getRegistrationViewsByReferenceIds(
        {
          programId,
          select: [
            ...new Set(
              exportColumns.concat([GenericRegistrationAttributes.referenceId]),
            ),
          ], // add referenceId (and deduplicate) to join transfer value later
          referenceIds,
        },
      );

    return this.joinRegistrationsAndTransactions(
      registrations,
      transactions,
      exportColumns,
    );
  }

  private async getExportFieldsForConfiguration(
    programFspConfigurationId: number,
  ): Promise<string[]> {
    const excelConfiguration =
      await this.excelFspConfigurationRepository.getByProgramFspConfigurationId(
        {
          programFspConfigurationId,
        },
      );

    if (!excelConfiguration) {
      throw new HttpException(
        `Excel FSP configuration is pending for program FSP configuration ${programFspConfigurationId}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return excelConfiguration.exportFields;
  }

  /**
   * A pure function.
   */
  public joinRegistrationsAndTransactions(
    registrations: Awaited<
      ReturnType<RegistrationsPaginationService['getRegistrationViewsNoLimit']>
    >,
    transactions: TransactionEntity[],
    exportColumns: string[],
  ): ExcelFspInstructions[] {
    // # of transactions and registrations should be the same or throw
    if (transactions.length !== registrations.length) {
      throw new Error(
        `Number of transactions (${transactions.length}) and registrations (${registrations.length}) do not match`,
      );
    }
    // This method joins the registrations and transactions arrays based on the referenceId.
    // We sort both arrays by referenceId. This allows us to use a two-pointer
    // technique to join the arrays, which is more efficient than using a nested loop or the find method.
    const transactionsOrdered = transactions.toSorted((a, b) =>
      a.registration.referenceId.localeCompare(b.registration.referenceId),
    );
    // Make sure registrations are also ordered by referenceId
    const orderedRegistrations = registrations.toSorted((a, b) =>
      a.referenceId.localeCompare(b.referenceId),
    );
    let j = 0;

    return orderedRegistrations.map((registration) => {
      const fspInstructions: ExcelFspInstructions = {
        referenceId: registration.referenceId,
        id: registration.id,
        amount: 0, // Initialize amount with a default value this value will be overwritten but it is necessary to have a value here
      };
      for (const col of exportColumns) {
        fspInstructions[col] = registration[col];
      }

      // As both arrays are sorted by referenceId, corresponding transactions for a registration
      // will always be at the current position or ahead in the transactions array.
      // This way performance is O(n) instead of O(n^2)
      while (
        transactionsOrdered[j] &&
        transactionsOrdered[j].registration.referenceId <
          registration.referenceId
      ) {
        j++;
      }

      if (
        transactionsOrdered[j]?.registration.referenceId ===
        registration.referenceId
      ) {
        fspInstructions.amount = transactionsOrdered[j].transferValue!;
      }

      return fspInstructions;
    });
  }

  public async getImportMatchColumn(
    programFspConfigurationId: number,
  ): Promise<string> {
    const excelConfiguration =
      await this.excelFspConfigurationRepository.getByProgramFspConfigurationId(
        {
          programFspConfigurationId,
        },
      );
    if (!excelConfiguration) {
      throw new HttpException(
        `Excel FSP configuration is pending for program FSP configuration ${programFspConfigurationId}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return excelConfiguration.uniqueIdentifierField;
  }
}
