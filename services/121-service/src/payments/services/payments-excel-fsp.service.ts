import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Equal, In } from 'typeorm';

import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { FspInstructions } from '@121-service/src/payments/dto/fsp-instructions.dto';
import { ExcelService } from '@121-service/src/payments/fsp-integration/excel/excel.service';
import { PaymentsReportingService } from '@121-service/src/payments/services/payments-reporting.service';
import { TransactionEntity } from '@121-service/src/payments/transactions/entities/transaction.entity';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionViewScopedRepository } from '@121-service/src/payments/transactions/repositories/transaction.view.scoped.repository';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramPaymentsLocksService } from '@121-service/src/programs/program-payment-locks/program-payment-locks.service';

// The functionality in this service was meant a generic implementation of FSPs that work by importing and exporting files like vodacash
// but in the end we converged to using it only for a generically configurable excel based FSP integration
// TODO: REFACTOR: This should be refactored to be only for the excel FSP and it should be evaluated if code can be moved to the ExcelModule

@Injectable()
export class PaymentsExcelFspService {
  public constructor(
    private readonly excelService: ExcelService,
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
    private readonly programPaymentsLocksService: ProgramPaymentsLocksService,
    private readonly paymentsReportingService: PaymentsReportingService,
    private readonly transactionViewScopedRepository: TransactionViewScopedRepository,
  ) {}

  public async getFspInstructions(
    programId: number,
    paymentId: number,
  ): Promise<FspInstructions[]> {
    /////////////////////////////////////
    // Validation & preparation
    /////////////////////////////////////

    if (await this.programPaymentsLocksService.isPaymentInProgress(programId)) {
      throw new HttpException(
        'Cannot export FSP instructions while payment is in progress',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check if payment exists and belongs to program (also ensure that user has access to the payment as endpoint is protected by programId)
    await this.paymentsReportingService.findPaymentOrThrow(
      programId,
      paymentId,
    );

    const programFspConfigEntitiesWithFspInstruction =
      await this.programFspConfigurationRepository.find({
        where: {
          programId: Equal(programId),
          fspName: Equal(Fsps.excel),
        },
        order: {
          name: 'ASC',
        },
      });

    if (programFspConfigEntitiesWithFspInstruction.length === 0) {
      throw new HttpException(
        'No program FSP configuration with Excel FSP found for this program',
        HttpStatus.NOT_FOUND,
      );
    }

    const transactions = await this.transactionViewScopedRepository.find({
      where: {
        paymentId: Equal(paymentId),
        status: Equal(TransactionStatusEnum.waiting),
        programFspConfigurationName: In(
          programFspConfigEntitiesWithFspInstruction.map((p) => p.name),
        ), // TODO should this be filtered on programFspConfiguration from registration to take into account that a registration can switch after transaction have been created
      },
      relations: {
        registration: true,
      },
    });
    if (transactions.length === 0) {
      throw new HttpException(
        'No transactions found for this payment with FSPs that require to download payment instructions.',
        HttpStatus.NOT_FOUND,
      );
    }

    /////////////////////////////////////
    // Generate FSP instructions
    /////////////////////////////////////

    /// Separate transactionsWithFspInstruction based on their programFspConfigurationName
    const allFspInstructions: FspInstructions[] = [];
    for (const fspConfigEntity of programFspConfigEntitiesWithFspInstruction) {
      const fspInstructions =
        await this.getFspInstructionsPerProgramFspConfiguration({
          programId,
          transactions: transactions.filter(
            (t) => t.programFspConfigurationName === fspConfigEntity.name,
          ),
          programFspConfigurationName: fspConfigEntity.name,
          programFspConfigurationId: fspConfigEntity.id,
        });
      // Should we exclude empty instructions where fspInstructions.data.length is empty, I think it is clearer for the user if they than get an empty file
      allFspInstructions.push(fspInstructions);
    }

    return allFspInstructions;
  }

  private async getFspInstructionsPerProgramFspConfiguration({
    transactions,
    programId,
    programFspConfigurationName,
    programFspConfigurationId,
  }: {
    transactions: TransactionEntity[];
    programId: number;
    programFspConfigurationName: string;
    programFspConfigurationId: number;
  }): Promise<FspInstructions> {
    return {
      data: await this.excelService.getFspInstructions({
        transactions,
        programId,
        programFspConfigurationId,
      }),
      fileNamePrefix: programFspConfigurationName,
    };
  }
}
