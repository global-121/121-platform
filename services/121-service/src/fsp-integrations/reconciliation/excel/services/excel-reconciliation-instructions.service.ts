import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Equal, In } from 'typeorm';

import { ExcelService } from '@121-service/src/fsp-integrations/integrations/excel/excel.service';
import { ExcelReconciliationInstructions } from '@121-service/src/fsp-integrations/reconciliation/excel/dtos/excel-reconciliation-instructions.dto';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { PaymentsProgressHelperService } from '@121-service/src/payments/services/payments-progress.helper.service';
import { PaymentsReportingService } from '@121-service/src/payments/services/payments-reporting.service';
import { TransactionEntity } from '@121-service/src/payments/transactions/entities/transaction.entity';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionViewScopedRepository } from '@121-service/src/payments/transactions/repositories/transaction.view.scoped.repository';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramRegistrationAttributeRepository } from '@121-service/src/programs/repositories/program-registration-attribute.repository';
import { GenericRegistrationAttributes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';

@Injectable()
export class ExcelReconciliationInstructionsService {
  public constructor(
    private readonly excelService: ExcelService,
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
    private readonly paymentsProgressHelperService: PaymentsProgressHelperService,
    private readonly paymentsReportingService: PaymentsReportingService,
    private readonly transactionViewScopedRepository: TransactionViewScopedRepository,
    private readonly registrationsPaginationService: RegistrationsPaginationService,
    private readonly programRegistrationAttributeRepository: ProgramRegistrationAttributeRepository,
  ) {}

  public async getFspInstructions(
    programId: number,
    paymentId: number,
  ): Promise<ExcelReconciliationInstructions[]> {
    /////////////////////////////////////
    // Validation & preparation
    /////////////////////////////////////

    if (
      await this.paymentsProgressHelperService.isPaymentInProgress(programId)
    ) {
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
    const allFspInstructions: ExcelReconciliationInstructions[] = [];
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
  }): Promise<ExcelReconciliationInstructions> {
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

    return {
      data: this.excelService.joinRegistrationsAndTransactions(
        registrations,
        transactions,
        exportColumns,
      ),
      fileNamePrefix: programFspConfigurationName,
    };
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
      return columnsToExportConfig;
    }

    // Default to using all program registration attributes names if columnsToExport is not specified
    // So generic fields must be specified in the programFspConfiguration
    return this.programRegistrationAttributeRepository.getNamesByProgramId(
      programId,
    );
  }
}
