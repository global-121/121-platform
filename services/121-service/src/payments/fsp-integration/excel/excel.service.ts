import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FspConfigurationEnum, FspName } from '../../../fsp/enum/fsp-name.enum';
import { ProgramEntity } from '../../../programs/program.entity';
import { RegistrationsPaginationService } from '../../../registration/services/registrations-pagination.service';
import { StatusEnum } from '../../../shared/enum/status.enum';
import { PaPaymentDataDto } from '../../dto/pa-payment-data.dto';
import {
  FspTransactionResultDto,
  PaTransactionResultDto,
} from '../../dto/payment-transaction-result.dto';
import { TransactionReturnDto } from '../../transactions/dto/get-transaction.dto';
import { TransactionsService } from '../../transactions/transactions.service';
import { FinancialServiceProviderIntegrationInterface } from '../fsp-integration.interface';
import { ExcelFspInstructions } from './dto/excel-fsp-instructions.dto';

@Injectable()
export class ExcelService
  implements FinancialServiceProviderIntegrationInterface
{
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;

  public constructor(
    private readonly transactionsService: TransactionsService,
    private readonly registrationsPaginationService: RegistrationsPaginationService,
  ) {}

  public async getQueueProgress(_programId: number): Promise<number> {
    // TODO: When this is implemented, remove the '_' from the variable. This is a temporary solution to avoid the linter error.
    throw new Error('Method not implemented.');
  }

  public async sendPayment(
    paPaymentList: PaPaymentDataDto[],
    programId: number,
    paymentNr: number,
  ): Promise<FspTransactionResultDto> {
    const fspTransactionResult = new FspTransactionResultDto();
    fspTransactionResult.paList = [];
    fspTransactionResult.fspName = FspName.excel;
    for (const paPayment of paPaymentList) {
      const transactionResult = new PaTransactionResultDto();
      transactionResult.calculatedAmount = paPayment.transactionAmount;
      transactionResult.fspName = FspName.excel;
      transactionResult.referenceId = paPayment.referenceId;
      transactionResult.status = StatusEnum.success; // TODO: change this to 'waiting' once reconciliation is implemented
      fspTransactionResult.paList.push(transactionResult);
    }
    await this.transactionsService.storeAllTransactions(
      fspTransactionResult,
      programId,
      paymentNr,
    );

    return fspTransactionResult;
  }

  public async getFspInstructions(
    transactions: TransactionReturnDto[],
    programId: number,
  ): Promise<ExcelFspInstructions[]> {
    const programWithConfig = await this.programRepository
      .createQueryBuilder('program')
      .leftJoinAndSelect('program.programQuestions', 'programQuestions')
      .leftJoinAndSelect(
        'program.programCustomAttributes',
        'programCustomAttributes',
      )
      .leftJoinAndSelect(
        'program.programFspConfiguration',
        'programFspConfiguration',
        'programFspConfiguration.name = :configName',
        { configName: FspConfigurationEnum.columnsToExport },
      )
      .andWhere('program.id = :programId', {
        programId: programId,
      })
      .getOne();

    let exportColumns: string[];
    const columnsToExportConfig =
      programWithConfig.programFspConfiguration[0]?.value;
    if (columnsToExportConfig) {
      exportColumns = JSON.parse(columnsToExportConfig);
    } else {
      // Default to using all program questions & attributes names if columnsToExport is not specified
      // So generic fields must be specified in the programFspConfiguration
      exportColumns = programWithConfig.programQuestions
        .map((q) => q.name)
        .concat(programWithConfig.programCustomAttributes.map((q) => q.name));
    }
    exportColumns = [...new Set(exportColumns)]; // remove duplicates
    const referenceIds = transactions.map((t) => t.referenceId);
    const registrations = await this.registrationsPaginationService.getPaginate(
      {
        select: exportColumns.concat(['referenceId']), //add referenceId to join transaction amount later
        filter: { referenceId: `$in:${referenceIds.join(',')}` },
        path: '',
      },
      programId,
      true,
      true,
    );

    const excelFspInstructions = registrations.data.map((registration) => {
      const fspInstructions = new ExcelFspInstructions();
      for (const col of exportColumns) {
        fspInstructions[col] = registration[col];
      }
      fspInstructions.amount = transactions.find(
        (t) => t.referenceId === registration.referenceId,
      ).amount;
      return fspInstructions;
    });

    return excelFspInstructions;
  }
}
