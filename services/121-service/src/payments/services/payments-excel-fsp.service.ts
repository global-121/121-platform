import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Equal, In } from 'typeorm';

import { AdditionalActionType } from '@121-service/src/actions/action.entity';
import { ActionsService } from '@121-service/src/actions/actions.service';
import { FspIntegrationType } from '@121-service/src/fsps/enums/fsp-integration-type.enum';
import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { FSP_SETTINGS } from '@121-service/src/fsps/fsp-settings.const';
import { FspInstructions } from '@121-service/src/payments/dto/fsp-instructions.dto';
import { ExcelService } from '@121-service/src/payments/fsp-integration/excel/excel.service';
import { PaymentsProgressHelperService } from '@121-service/src/payments/services/payments-progress.helper.service';
import { TransactionReturnDto } from '@121-service/src/payments/transactions/dto/get-transaction.dto';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';

// The functionality in this service was meant a generic implementation of FSPs that work by importing and exporting files like vodacash
// but in the end we converged to using it only for a generically configurable excel based FSP integration
// TODO: REFACTOR: This should be refactored to be only for the excel FSP and it should be evaluated if code can be moved to the ExcelModule

@Injectable()
export class PaymentsExcelFspService {
  public constructor(
    private readonly actionService: ActionsService,
    private readonly transactionsService: TransactionsService,
    private readonly excelService: ExcelService,
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
    private readonly paymentsProgressHelperService: PaymentsProgressHelperService,
  ) {}

  public async getFspInstructions(
    programId: number,
    paymentId: number,
    userId: number,
  ): Promise<FspInstructions[]> {
    if (
      await this.paymentsProgressHelperService.isPaymentInProgress(programId)
    ) {
      throw new HttpException(
        'Cannot export FSP instructions while payment is in progress',
        HttpStatus.BAD_REQUEST,
      );
    }

    const transactions = await this.transactionsService.getLastTransactions({
      programId,
      paymentId,
    });

    const programFspConfigEntitiesWithFspInstruction =
      await this.programFspConfigurationRepository.find({
        where: {
          programId: Equal(programId),
          fspName: In(this.getFspNamesThatRequireInstructions()),
        },
        order: {
          name: 'ASC',
        },
      });

    const transactionsWithFspInstruction =
      this.filterTransactionsWithFspInstructionBasedOnStatus(
        transactions,
        programFspConfigEntitiesWithFspInstruction,
      );

    if (transactionsWithFspInstruction.length === 0) {
      throw new HttpException(
        'No transactions found for this payment with FSPs that require to download payment instructions.',
        HttpStatus.NOT_FOUND,
      );
    }

    /// Separate transactionsWithFspInstruction based on their programFspConfigurationName
    const allFspInstructions: FspInstructions[] = [];
    for (const fspConfigEntity of programFspConfigEntitiesWithFspInstruction) {
      const fspInstructions =
        await this.getFspInstructionsPerProgramFspConfiguration({
          programId,
          paymentId,
          transactions: transactionsWithFspInstruction.filter(
            (t) => t.programFspConfigurationName === fspConfigEntity.name,
          ),
          programFspConfigurationName: fspConfigEntity.name,
          programFspConfigurationId: fspConfigEntity.id,
          fspName: fspConfigEntity.fspName,
        });
      // Should we exclude empty instructions where fspInstructions.data.length is empty, I think it is clearer for the user if they than get an empty file
      allFspInstructions.push(fspInstructions);
    }

    await this.actionService.saveAction(
      userId,
      programId,
      AdditionalActionType.exportFspInstructions,
    );
    return allFspInstructions;
  }

  private getFspNamesThatRequireInstructions(): Fsps[] {
    return Object.values(FSP_SETTINGS)
      .filter((fsp: any) => [FspIntegrationType.csv].includes(fsp.integrationType))
      .map((fsp: any) => fsp.name);
  }

  private filterTransactionsWithFspInstructionBasedOnStatus(
    transactions: TransactionReturnDto[],
    programFspConfigEntitiesWithFspInstruction: ProgramFspConfigurationEntity[],
  ): TransactionReturnDto[] {
    const programFspConfigNamesThatRequireInstructions =
      programFspConfigEntitiesWithFspInstruction.map((c: any) => c.name);

    const transactionsWithFspInstruction = transactions.filter((t: any) =>
      programFspConfigNamesThatRequireInstructions.includes(
        t.programFspConfigurationName,
      ),
    );

    const result: TransactionReturnDto[] = [];
    for (const transaction of transactionsWithFspInstruction) {
      if (
        // Only export waiting transactions, as others have already been reconciliated
        transaction.status === TransactionStatusEnum.waiting
      ) {
        result.push(transaction);
      }
    }
    return result;
  }

  private async getFspInstructionsPerProgramFspConfiguration({
    transactions,
    programId,
    paymentId,
    programFspConfigurationName,
    programFspConfigurationId,
    fspName,
  }: {
    transactions: TransactionReturnDto[];
    programId: number;
    paymentId: number;
    programFspConfigurationName: string;
    programFspConfigurationId: number;
    fspName: Fsps;
  }): Promise<FspInstructions> {
    if (fspName === Fsps.excel) {
      return {
        data: await this.excelService.getFspInstructions({
          transactions,
          programId,
          paymentId,
          programFspConfigurationId,
        }),
        fileNamePrefix: programFspConfigurationName,
      };
    }
    // Is this the best way to prevent a TypeError on the return type?
    throw new Error(`FspName ${fspName} not supported in fsp export`);
  }
}
