import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { ExcelFspInstructions } from '@121-service/src/fsp-integrations/integrations/excel/dto/excel-fsp-instructions.dto';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { TransactionEntity } from '@121-service/src/payments/transactions/entities/transaction.entity';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { GenericRegistrationAttributes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';

@Injectable()
export class ExcelService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;

  public constructor(
    //TODO: This should be refactored to not use the registrationPaginationService, maybe this entire service/module should be deleted and moved to the PaymentsExcelFspService
    private readonly registrationsPaginationService: RegistrationsPaginationService,
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
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
    const exportColumns = await this.getExportColumnsForProgramFspConfig(
      programFspConfigurationId,
      programId,
    );
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

  private async getExportColumnsForProgramFspConfig(
    programFspConfigurationId: number,
    programId: number,
  ): Promise<string[]> {
    const columnsToExportConfig =
      await this.programFspConfigurationRepository.getPropertyValueByName({
        programFspConfigurationId,
        name: FspConfigurationProperties.columnsToExport,
      });

    if (columnsToExportConfig) {
      // check if columnsToExportConfig is a string array or throw an error
      if (!Array.isArray(columnsToExportConfig)) {
        throw new HttpException(
          {
            errors: `FspConfigurationProperty ${FspConfigurationProperties.columnsToExport} must be an array, but received ${typeof columnsToExportConfig}`,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return columnsToExportConfig;
    }

    const programWithAttributes = await this.programRepository.findOneOrFail({
      where: { id: Equal(programId) },
      relations: ['programRegistrationAttributes'],
    });
    // Default to using all program registration attributes names if columnsToExport is not specified
    // So generic fields must be specified in the programFspConfiguration
    return programWithAttributes.programRegistrationAttributes.map(
      (q) => q.name,
    );
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
      await this.programFspConfigurationRepository.getPropertyValueByName({
        programFspConfigurationId,
        name: FspConfigurationProperties.columnToMatch,
      });
    if (!matchColumn) {
      throw new HttpException(
        {
          errors: `No match column found for FSP 'Excel' and programFspConfigurationId with id ${programFspConfigurationId}`,
        },
        HttpStatus.NOT_FOUND,
      );
    }
    if (typeof matchColumn !== 'string') {
      throw new HttpException(
        {
          errors: `Match column must be a string, but received ${typeof matchColumn}`,
        },
        HttpStatus.NOT_FOUND,
      );
    }
    return matchColumn;
  }
}
