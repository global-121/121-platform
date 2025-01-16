import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import {
  FinancialServiceProviderConfigurationProperties,
  FinancialServiceProviders,
} from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import {
  FspTransactionResultDto,
  PaTransactionResultDto,
} from '@121-service/src/payments/dto/payment-transaction-result.dto';
import { TransactionRelationDetailsDto } from '@121-service/src/payments/dto/transaction-relation-details.dto';
import { ExcelFspInstructions } from '@121-service/src/payments/fsp-integration/excel/dto/excel-fsp-instructions.dto';
import { FinancialServiceProviderIntegrationInterface } from '@121-service/src/payments/fsp-integration/fsp-integration.interface';
import { TransactionReturnDto } from '@121-service/src/payments/transactions/dto/get-transaction.dto';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { ProgramFinancialServiceProviderConfigurationRepository } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.repository';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { FileImportService } from '@121-service/src/utils/file-import/file-import.service';

@Injectable()
export class ExcelService
  implements FinancialServiceProviderIntegrationInterface
{
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;

  private statusColumnName = 'status';

  public constructor(
    private readonly transactionsService: TransactionsService,
    private readonly registrationsPaginationService: RegistrationsPaginationService,
    private readonly programFinancialServiceProviderConfigurationRepository: ProgramFinancialServiceProviderConfigurationRepository,
    private readonly fileImportService: FileImportService,
  ) {}

  public async sendPayment(
    paPaymentList: PaPaymentDataDto[],
    programId: number,
    paymentNr: number,
  ): Promise<FspTransactionResultDto> {
    const transactionResultObjectList: {
      paTransactionResultDto: PaTransactionResultDto;
      transactionRelationDetailsDto: TransactionRelationDetailsDto;
    }[] = [];

    for (const paPayment of paPaymentList) {
      const paTransactionResultDto = new PaTransactionResultDto();
      paTransactionResultDto.calculatedAmount = paPayment.transactionAmount;
      paTransactionResultDto.fspName = FinancialServiceProviders.excel;
      paTransactionResultDto.referenceId = paPayment.referenceId;
      paTransactionResultDto.status = TransactionStatusEnum.waiting;

      const transactionRelationDetailsDto = {
        programId,
        paymentNr,
        userId: paPaymentList[0].userId,
        programFinancialServiceProviderConfigurationId:
          paPayment.programFinancialServiceProviderConfigurationId,
      };

      const transactionResultObject = {
        paTransactionResultDto,
        transactionRelationDetailsDto,
      };

      transactionResultObjectList.push(transactionResultObject);
    }

    await this.transactionsService.storeAllTransactions(
      transactionResultObjectList,
    );

    const fspTransactionResult = new FspTransactionResultDto();
    fspTransactionResult.fspName = FinancialServiceProviders.excel;
    fspTransactionResult.paList = transactionResultObjectList.map(
      (transactionResultObject) =>
        transactionResultObject.paTransactionResultDto,
    );
    return fspTransactionResult;
  }

  public async getFspInstructions({
    transactions,
    programId,
    payment,
    programFinancialServiceProviderConfigurationId,
  }: {
    transactions: TransactionReturnDto[];
    programId: number;
    payment: number;
    programFinancialServiceProviderConfigurationId: number;
  }): Promise<ExcelFspInstructions[]> {
    const exportColumns = await this.getExportColumnsForProgramFspConfig(
      programFinancialServiceProviderConfigurationId,
      programId,
    );
    // TODO: Think about refactoring it's probably better use the transaction ids instead of the referenceIds not sure what the original reasoning was
    // Creating a new query builder since it is imposssible to do a where in query if there are more than 500000 referenceIds
    // TODO: Also refactor this so that the excel service does not know about transactions, so than this query should be moved to a repository and be called in another service
    const qb =
      this.registrationsPaginationService.getQueryBuilderForFspInstructions({
        programId,
        payment,
        programFinancialServiceProviderConfigurationId,
        status: TransactionStatusEnum.waiting,
      });
    const chunkSize = 400000;
    const registrations =
      await this.registrationsPaginationService.getRegistrationsChunked(
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
    programFinancialServiceProviderConfigurationId: number,
    programId: number,
  ): Promise<string[]> {
    const columnsToExportConfig =
      await this.programFinancialServiceProviderConfigurationRepository.getPropertyValueByName(
        {
          programFinancialServiceProviderConfigurationId,
          name: FinancialServiceProviderConfigurationProperties.columnsToExport,
        },
      );

    if (columnsToExportConfig) {
      // check if columnsToExportConfig is a string array or throw an error
      if (!Array.isArray(columnsToExportConfig)) {
        throw new HttpException(
          {
            errors: `FinancialServiceProviderConfigurationProperty ${FinancialServiceProviderConfigurationProperties.columnsToExport} must be an array, but received ${typeof columnsToExportConfig}`,
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
      ReturnType<RegistrationsPaginationService['getRegistrationsChunked']>
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
    programFinancialServiceProviderConfigurationId: number,
  ): Promise<string> {
    const matchColumn =
      await this.programFinancialServiceProviderConfigurationRepository.getPropertyValueByName(
        {
          programFinancialServiceProviderConfigurationId,
          name: FinancialServiceProviderConfigurationProperties.columnToMatch,
        },
      );
    if (!matchColumn) {
      throw new HttpException(
        {
          errors: `No match column found for FSP 'Excel' and programFinancialServiceProviderConfigurationId with id ${programFinancialServiceProviderConfigurationId}`,
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
