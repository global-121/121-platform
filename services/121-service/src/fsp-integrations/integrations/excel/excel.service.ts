import { Injectable } from '@nestjs/common';

import { ExcelFspInstructions } from '@121-service/src/fsp-integrations/integrations/excel/dto/excel-fsp-instructions.dto';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { TransactionEntity } from '@121-service/src/payments/transactions/entities/transaction.entity';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { MappedPaginatedRegistrationDto } from '@121-service/src/registration/dto/mapped-paginated-registration.dto';

@Injectable()
export class ExcelService {
  public constructor(
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
  ) {}

  /**
   * A pure function.
   */
  public joinRegistrationsAndTransactions(
    registrations: MappedPaginatedRegistrationDto[],
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
    const transactionsOrdered = transactions.sort((a, b) =>
      a.registration.referenceId.localeCompare(b.registration.referenceId),
    );
    // Make sure registrations are also ordered by referenceId
    const orderedRegistrations = registrations.sort((a, b) =>
      a.referenceId.localeCompare(b.referenceId),
    );
    let j = 0;
    const excelFspInstructions = orderedRegistrations.map((registration) => {
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
        transactionsOrdered[j] &&
        transactionsOrdered[j].registration.referenceId ===
          registration.referenceId
      ) {
        fspInstructions.amount = transactionsOrdered[j].transferValue!;
      }

      return fspInstructions;
    });
    return excelFspInstructions;
  }

  public async getImportMatchColumn(
    programFspConfigurationId: number,
  ): Promise<string> {
    const matchColumn =
      await this.programFspConfigurationRepository.getPropertyValueByNameOrThrow(
        {
          programFspConfigurationId,
          name: FspConfigurationProperties.columnToMatch,
        },
      );

    return matchColumn;
  }
}
