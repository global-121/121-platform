import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { ExcelReconciliationDefaultColumns } from '@121-service/src/fsp-integrations/reconciliation/excel/enum/excel-reconciliation-default-columns.enum';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramRegistrationAttributeRepository } from '@121-service/src/programs/repositories/program-registration-attribute.repository';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';
import { CsvContents } from '@121-service/src/utils/file-import/file-import.service';

@Injectable()
export class ExcelReconciliationValidationService {
  public constructor(
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
    private readonly programRegistrationAttributeRepository: ProgramRegistrationAttributeRepository,
    private readonly registrationViewScopedRepository: RegistrationViewScopedRepository,
  ) {}

  public async validateOnlyOneMatchColumnIsUsedAndReturnIt({
    fspConfigs,
    importColumnNames,
  }: {
    fspConfigs: ProgramFspConfigurationEntity[];
    importColumnNames: string[];
  }): Promise<string> {
    const matchColumnsFromProgramFsps: string[] = [];
    for (const fspConfig of fspConfigs) {
      const matchColumn =
        (await this.programFspConfigurationRepository.getPropertyValueByName({
          programFspConfigurationId: fspConfig.id,
          name: FspConfigurationProperties.columnToMatch,
        })) as string;
      matchColumnsFromProgramFsps.push(matchColumn);
    }
    const uniqueMatchColumns = new Set(matchColumnsFromProgramFsps);

    // validate that only one match column is used in the import file
    const matchColumnsInImportFile = importColumnNames.filter((column) =>
      matchColumnsFromProgramFsps.includes(column),
    );
    if (matchColumnsInImportFile.length > 1) {
      const errors = `Multiple match columns found in the import file. Please only use one of the following match columns: ${[
        ...uniqueMatchColumns,
      ].join(', ')}.`;
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }
    // Throw if no match column is found in the import file
    if (matchColumnsInImportFile.length === 0) {
      const errors = `No match column found in the import file. Please use one of the following match columns: ${[
        ...uniqueMatchColumns,
      ].join(', ')}.`;
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }

    return matchColumnsInImportFile[0];
  }

  public validateNoDuplicateValuesInMatchColumn({
    importRecords,
    matchColumn,
  }: {
    importRecords: Record<string, string | number | boolean | undefined>[];
    matchColumn: string;
  }): void {
    const matchColumnValues = importRecords.map((r) => r[matchColumn]);
    const uniqueMatchColumnValues = new Set(matchColumnValues);
    if (uniqueMatchColumnValues.size !== matchColumnValues.length) {
      const errors = `The match column '${matchColumn}' contains duplicate values.`;
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }
  }

  public validateProgramHasExcelFspConfigs(
    fspConfigs: ProgramFspConfigurationEntity[],
  ): ProgramFspConfigurationEntity[] {
    const fspConfigsExcel = fspConfigs.filter(
      (config) => config.fspName === Fsps.excel,
    );
    if (!fspConfigsExcel.length) {
      throw new HttpException(
        'Configured program does not have an `Excel` FSP configuration',
        HttpStatus.NOT_FOUND,
      );
    }
    return fspConfigsExcel;
  }

  public async validateExactlyOneFspConfigAndReturnIt({
    matchColumn,
    csvContents,
    paymentId,
    programId,
  }: {
    matchColumn: string;
    csvContents: CsvContents;
    paymentId: number;
    programId: number;
  }): Promise<number> {
    const matchColumnValues = csvContents.map((r) => r[matchColumn]);
    const programRegistrationAttributeId =
      await this.programRegistrationAttributeRepository.getIdByNameAndProgramId(
        {
          name: matchColumn,
          programId,
        },
      );
    const uniqueFspConfigIds =
      await this.registrationViewScopedRepository.getUniqueFspConfigIdsByPaymentAndRegistrationData(
        {
          paymentId,
          programRegistrationAttributeId,
          dataValues: matchColumnValues,
        },
      );
    if (uniqueFspConfigIds.length > 1) {
      throw new HttpException(
        `Expected imported reconciliation to be related only to one FSP configuration, but found multiple`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (uniqueFspConfigIds.length === 0) {
      throw new HttpException(
        `No matches found in relation to imported reconciliation`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return uniqueFspConfigIds[0]; // There is exactly one, so take the first
  }

  public validateStatusColumn(csvContents: CsvContents): void {
    // Validate status exists
    const columnName = ExcelReconciliationDefaultColumns.status;
    if (!csvContents[0][columnName]) {
      throw new HttpException(
        `The status column is missing. Please make sure the column is named '${columnName}'`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate status values
    const statusValues = csvContents.map((row) => row[columnName]);
    const allowedStatusValues = [
      String(TransactionStatusEnum.success),
      String(TransactionStatusEnum.error),
    ];
    for (const status of statusValues) {
      if (!allowedStatusValues.includes(String(status))) {
        throw new HttpException(
          `Invalid status value '${status}'. Allowed values are: ${allowedStatusValues.join(', ')}`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }

  public validateErrorMessageColumn(csvContents: CsvContents): void {
    for (const content of csvContents) {
      if (
        content.errorMessage &&
        content.status === TransactionStatusEnum.success
      ) {
        throw new HttpException(
          `Error message not allowed when status is success`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }
}
