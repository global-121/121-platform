import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Equal, In } from 'typeorm';

import { AdditionalActionType } from '@121-service/src/actions/action.entity';
import { ActionsService } from '@121-service/src/actions/actions.service';
import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { FspIntegrationType } from '@121-service/src/fsps/fsp-integration-type.enum';
import { FSP_SETTINGS } from '@121-service/src/fsps/fsp-settings.const';
import { FspInstructions } from '@121-service/src/payments/dto/fsp-instructions.dto';
import { ExcelService } from '@121-service/src/payments/fsp-integration/excel/excel.service';
import { TransactionReturnDto } from '@121-service/src/payments/transactions/dto/get-transaction.dto';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { ProjectFspConfigurationEntity } from '@121-service/src/project-fsp-configurations/entities/project-fsp-configuration.entity';
import { ProjectFspConfigurationRepository } from '@121-service/src/project-fsp-configurations/project-fsp-configurations.repository';

// The functionality in this service was meant a generic implementation of FSPs that work by importing and exporting files like vodacash
// but in the end we converged to using it only for a generically configurable excel based FSP integration
// TODO: REFACTOR: This should be refactored to be only for the excel FSP and it should be evaluated if code can be moved to the ExcelModule

@Injectable()
export class PaymentsExcelFspService {
  public constructor(
    private readonly actionService: ActionsService,
    private readonly transactionsService: TransactionsService,
    private readonly excelService: ExcelService,
    private readonly projectFspConfigurationRepository: ProjectFspConfigurationRepository,
  ) {}

  public async getFspInstructions(
    projectId: number,
    paymentId: number,
    userId: number,
  ): Promise<FspInstructions[]> {
    const transactions = await this.transactionsService.getLastTransactions({
      projectId,
      paymentId,
    });

    const projectFspConfigEntitiesWithFspInstruction =
      await this.projectFspConfigurationRepository.find({
        where: {
          projectId: Equal(projectId),
          fspName: In(this.getFspNamesThatRequireInstructions()),
        },
        order: {
          name: 'ASC',
        },
      });

    const transactionsWithFspInstruction =
      this.filterTransactionsWithFspInstructionBasedOnStatus(
        transactions,
        projectFspConfigEntitiesWithFspInstruction,
      );

    if (transactionsWithFspInstruction.length === 0) {
      throw new HttpException(
        'No transactions found for this payment with FSPs that require to download payment instructions.',
        HttpStatus.NOT_FOUND,
      );
    }

    /// Seprate transactionsWithFspInstruction based on their projectFspConfigurationName
    const allFspInstructions: FspInstructions[] = [];
    for (const fspConfigEntity of projectFspConfigEntitiesWithFspInstruction) {
      const fspInstructions =
        await this.getFspInstructionsPerProjectFspConfiguration({
          projectId,
          paymentId,
          transactions: transactionsWithFspInstruction.filter(
            (t) => t.projectFspConfigurationName === fspConfigEntity.name,
          ),
          projectFspConfigurationName: fspConfigEntity.name,
          projectFspConfigurationId: fspConfigEntity.id,
          fspName: fspConfigEntity.fspName,
        });
      // Should we exclude empty instructions where fspInstructions.data.length is empty, I think it is clearer for the user if they than get an empty file
      allFspInstructions.push(fspInstructions);
    }

    await this.actionService.saveAction(
      userId,
      projectId,
      AdditionalActionType.exportFspInstructions,
    );
    return allFspInstructions;
  }

  private getFspNamesThatRequireInstructions(): string[] {
    return FSP_SETTINGS.filter((fsp) =>
      [FspIntegrationType.csv].includes(fsp.integrationType),
    ).map((fsp) => fsp.name);
  }

  private filterTransactionsWithFspInstructionBasedOnStatus(
    transactions: TransactionReturnDto[],
    projectFspConfigEntitiesWithFspInstruction: ProjectFspConfigurationEntity[],
  ): TransactionReturnDto[] {
    const projectFspConfigNamesThatRequireInstructions =
      projectFspConfigEntitiesWithFspInstruction.map((c) => c.name);

    const transactionsWithFspInstruction = transactions.filter((t) =>
      projectFspConfigNamesThatRequireInstructions.includes(
        t.projectFspConfigurationName,
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

  private async getFspInstructionsPerProjectFspConfiguration({
    transactions,
    projectId,
    paymentId,
    projectFspConfigurationName,
    projectFspConfigurationId,
    fspName,
  }: {
    transactions: TransactionReturnDto[];
    projectId: number;
    paymentId: number;
    projectFspConfigurationName: string;
    projectFspConfigurationId: number;
    fspName: Fsps;
  }): Promise<FspInstructions> {
    if (fspName === Fsps.excel) {
      return {
        data: await this.excelService.getFspInstructions({
          transactions,
          projectId,
          paymentId,
          projectFspConfigurationId,
        }),
        fileNamePrefix: projectFspConfigurationName,
      };
    }
    // Is this the best way to prevent a typeerror on the return type?
    throw new Error(`FspName ${fspName} not supported in fsp export`);
  }
}
