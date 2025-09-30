import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { FspConfigurationProperties } from '@121-service/src/fsps/enums/fsp-name.enum';
import { ExcelFspInstructions } from '@121-service/src/payments/fsp-integration/excel/dto/excel-fsp-instructions.dto';
import { TransactionReturnDto } from '@121-service/src/payments/transactions/dto/get-transaction.dto';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';

@Injectable()
export class ExcelService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;

  public constructor(
    private readonly registrationsPaginationService: RegistrationsPaginationService,
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
    private readonly registrationViewScopedRepository: RegistrationViewScopedRepository,
  ) {}

  public async getFspInstructions({
    transactions,
    programId,
    paymentId,
    programFspConfigurationId,
  }: {
    transactions: TransactionReturnDto[];
    programId: number;
    paymentId: number;
    programFspConfigurationId: number;
  }): Promise<ExcelFspInstructions[]> {
    const exportColumns = await this.getExportColumnsForProgramFspConfig(
      programFspConfigurationId,
      programId,
    );
    // TODO: Think about refactoring it's probably better use the transaction ids instead of the referenceIds not sure what the original reasoning was
    // Creating a new query builder since it is impossible to do a where in query if there are more than 500000 referenceIds
    // TODO: Also refactor this so that the excel service does not know about transactions, so than this query should be moved to a repository and be called in another service
    const qb =
      this.registrationViewScopedRepository.getQueryBuilderForFspInstructions({
        programId,
        paymentId,
        programFspConfigurationId,
        status: TransactionStatusEnum.waiting,
      });
    const chunkSize = 400000;
    const registrations =
      await this.registrationsPaginationService.getRegistrationViewsChunkedByPaginateQuery(
        programId,
        {
          select: [...new Set(exportColumns.concat(['referenceId']))], // add referenceId (and deduplicate) to join transaction amount later
          path: '',
        },
        chunkSize,
        qb,
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

  public joinRegistrationsAndTransactions(
    orderedRegistrations: Awaited<
      ReturnType<
        RegistrationsPaginationService['getRegistrationViewsChunkedByPaginateQuery']
      >
    >,
    transactions: TransactionReturnDto[],
    exportColumns: string[],
  ): ExcelFspInstructions[] {
    // # of transactions and registrations should be the same or throw
    if (transactions.length !== orderedRegistrations.length) {
      throw new Error(
        `Number of transactions (${transactions.length}) and registrations (${orderedRegistrations.length}) do not match`,
      );
    }
    // This method joins the registrations and transactions arrays based on the referenceId.
    // Both arrays are assumed to be sorted by referenceId. This allows us to use a two-pointer
    // technique to join the arrays, which is more efficient than using a nested loop or the find method.
    const transactionsOrdered = transactions.sort((a, b) =>
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
        transactionsOrdered[j].referenceId < registration.referenceId
      ) {
        j++;
      }

      if (
        transactionsOrdered[j] &&
        transactionsOrdered[j].referenceId === registration.referenceId
      ) {
        fspInstructions.amount = transactionsOrdered[j].amount;
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
