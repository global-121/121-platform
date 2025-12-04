import { Injectable } from '@nestjs/common';

import { ImportReconciliationResponseDto } from '@121-service/src/fsp-integrations/reconciliation/excel/dtos/import-reconciliation-response.dto';
import { ReconciliationFeedbackDto } from '@121-service/src/payments/dto/reconciliation-feedback.dto';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { ProgramRegistrationAttributeRepository } from '@121-service/src/programs/repositories/program-registration-attribute.repository';
import { ImportStatus } from '@121-service/src/registration/dto/bulk-import.dto';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';
import { CsvContents } from '@121-service/src/utils/file-import/file-import.service';

@Injectable()
export class ExcelReconciliationFeedbackService {
  public constructor(
    private readonly registrationViewScopedRepository: RegistrationViewScopedRepository,
    private readonly programRegistrationAttributeRepository: ProgramRegistrationAttributeRepository,
  ) {}

  public async createFeedbackDto({
    programId,
    paymentId,
    matchColumn,
    csvContents,
  }: {
    programId: number;
    paymentId: number;
    matchColumn: string;
    csvContents: CsvContents;
  }): Promise<ImportReconciliationResponseDto> {
    const programRegistrationAttributeId =
      await this.programRegistrationAttributeRepository.getIdByNameAndProgramId(
        {
          name: matchColumn,
          programId,
        },
      );

    const resultObjects =
      await this.registrationViewScopedRepository.getReferenceIdsAndStatusesByPaymentForRegistrationData(
        {
          paymentId,
          programRegistrationAttributeId,
          dataValues: csvContents.map((r) => r[matchColumn]),
        },
      );

    const feedback: ReconciliationFeedbackDto[] = [];
    for (const { referenceId, status, value } of resultObjects) {
      feedback.push({
        [matchColumn]: value,
        importStatus:
          status === TransactionStatusEnum.success
            ? ImportStatus.paymentSuccess
            : ImportStatus.paymentFailed,
        referenceId,
      });
    }

    const notFoundMatchColumnValues = this.getNotFoundMatchColumnValues({
      matchColumnsValuesInImportFile: csvContents.map((r) =>
        String(r[matchColumn]),
      ),
      matchColumnsValuesInDatabase: resultObjects.map((r) => r.value),
    });

    for (const notFoundValue of notFoundMatchColumnValues) {
      feedback.push({
        [matchColumn]: notFoundValue,
        importStatus: ImportStatus.notFound,
        referenceId: null,
      });
    }

    const summary = this.countFeedbackResults(feedback);
    return {
      importResult: feedback,
      aggregateImportResult: summary,
    };
  }

  private getNotFoundMatchColumnValues({
    matchColumnsValuesInImportFile,
    matchColumnsValuesInDatabase,
  }: {
    matchColumnsValuesInImportFile: string[];
    matchColumnsValuesInDatabase: string[];
  }): string[] {
    // Use a set for O(1) lookups (performance)
    const databaseSet = new Set(matchColumnsValuesInDatabase);
    return matchColumnsValuesInImportFile.filter(
      (value) => !databaseSet.has(value),
    );
  }

  private countFeedbackResults(feedback: ReconciliationFeedbackDto[]): {
    countPaymentSuccess: number;
    countPaymentFailed: number;
    countNotFound: number;
  } {
    let countPaymentSuccess = 0;
    let countPaymentFailed = 0;
    let countNotFound = 0;

    for (const result of feedback) {
      if (!result.referenceId) {
        countNotFound += 1;
        continue;
      }
      if (result.importStatus === ImportStatus.paymentSuccess) {
        countPaymentSuccess += 1;
      } else if (result.importStatus === ImportStatus.paymentFailed) {
        countPaymentFailed += 1;
      } else if (result.importStatus === ImportStatus.notFound) {
        countNotFound += 1;
      }
    }

    return { countPaymentSuccess, countPaymentFailed, countNotFound };
  }
}
