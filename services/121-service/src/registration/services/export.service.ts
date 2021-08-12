import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { ProgramEntity } from '../../programs/program/program.entity';
import { RegistrationEntity } from '../registration.entity';
import { RegistrationStatusEnum } from '../enum/registration-status.enum';
import { ProgramAnswerEntity } from '../program-answer.entity';
import { CustomDataAttributes } from '../../connection/validation-data/dto/custom-data-attributes';
import { ProgramQuestionEntity } from '../../programs/program/program-question.entity';
import { FspAttributeEntity } from '../../programs/fsp/fsp-attribute.entity';
import { FinancialServiceProviderEntity } from '../../programs/fsp/financial-service-provider.entity';
import { RegistrationStatusChangeEntity } from '../registration-status-change.entity';
import { ActionService } from '../../actions/action.service';
import { ExportType } from '../../programs/program/dto/export-details';
import { FileDto } from '../../programs/program/dto/file.dto';
import { ProgramQuestionForExport } from '../../programs/program/dto/criterium-for-export.dto';
import { IntersolvePayoutStatus } from '../../programs/fsp/api/enum/intersolve-payout-status.enum';
import { without, compact, sortBy } from 'lodash';
import { StatusEnum } from '../../shared/enum/status.enum';
import { TransactionEntity } from '../../programs/program/transactions.entity';

@Injectable()
export class ExportService {
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;
  @InjectRepository(RegistrationStatusChangeEntity)
  @InjectRepository(ProgramEntity)
  @InjectRepository(ProgramQuestionEntity)
  private readonly programQuestionRepository: Repository<ProgramQuestionEntity>;
  @InjectRepository(FspAttributeEntity)
  private readonly fspAttributeRepository: Repository<FspAttributeEntity>;
  @InjectRepository(TransactionEntity)
  private readonly transactionRepository: Repository<TransactionEntity>;

  public constructor(private readonly actionService: ActionService) {}

  public getExportList(
    programId: number,
    type: ExportType,
    installment: number | null = null,
    userId: number,
  ): Promise<FileDto> {
    this.actionService.saveAction(userId, programId, type);
    switch (type) {
      case ExportType.allPeopleAffected: {
        return this.getAllPeopleAffectedList(programId);
      }
      case ExportType.included: {
        return this.getInclusionList(programId);
      }
      case ExportType.selectedForValidation: {
        return this.getSelectedForValidationList(programId);
      }
      case ExportType.payment: {
        return this.getPaymentDetails(programId, installment);
      }
      case ExportType.unusedVouchers: {
        return this.getUnusedVouchers();
      }
      case ExportType.duplicatePhoneNumbers: {
        return this.getDuplicatePhoneNumbers(programId);
      }
    }
  }

  private async getPaymentDetails(
    programId: number,
    installmentId: number,
  ): Promise<FileDto> {
    let pastPaymentDetails = await this.getPaymentDetailsInstallment(
      programId,
      installmentId,
    );

    if (pastPaymentDetails.length === 0) {
      return {
        fileName: `payment-details-future-installment-${installmentId}.csv`,
        data: (await this.getInclusionList(programId)).data,
      };
    }

    pastPaymentDetails = await this.filterAttributesToExport(
      pastPaymentDetails,
    );

    const csvFile = {
      fileName: `payment-details-completed-installment-${installmentId}.csv`,
      data: this.jsonToCsv(pastPaymentDetails),
    };

    return csvFile;
  }

  private async filterAttributesToExport(pastPaymentDetails): Promise<any[]> {
    const criteria = (await this.getAllCriteriaForExport()).map(
      c => c.programQuestion,
    );
    const outputPaymentDetails = [];
    pastPaymentDetails.forEach(transaction => {
      Object.keys(transaction.customData).forEach(key => {
        if (criteria.includes(key)) {
          transaction[key] = transaction.customData[key];
        }
      });
      delete transaction.customData;
      outputPaymentDetails.push(transaction);
    });
    return outputPaymentDetails;
  }

  private async getUnusedVouchers(): Promise<FileDto> {
    const unusedVouchers = await this.fspService.getUnusedVouchers();
    unusedVouchers.forEach(v => {
      v.name = this.getName(v.customData);
      delete v.customData;
    });

    const response = {
      fileName: this.getExportFileName(ExportType.unusedVouchers),
      data: this.jsonToCsv(unusedVouchers),
    };

    return response;
  }

  private addGenericFieldsToExport(
    row: object,
    registration: RegistrationEntity,
  ): object {
    const genericFields = [
      'id',
      'phoneNumber',
      'importedDate',
      'invitedDate',
      'noLongerEligibleDate',
      'created',
      'appliedDate',
      'selectedForValidationDate',
      'validationDate',
      'inclusionDate',
      'inclusionEndDate',
      'rejectionDate',
      'namePartnerOrganization',
      'paymentAmountMultiplier',
      'note',
    ];
    genericFields.forEach(field => {
      row[field] = registration[field];
    });

    row['status'] = registration.registrationStatus;
    row['financialServiceProvider'] = registration.fsp?.fsp;

    return row;
  }

  private addProgramQuestionsToExport(
    row: object,
    programQuestions: ProgramQuestionForExport[],
    registration: RegistrationEntity,
    exportType: ExportType,
  ): object {
    programQuestions.forEach(question => {
      if (question.export && question.export.includes(exportType)) {
        row[question.programQuestion] =
          registration.customData[question.programQuestion];
      }
    });
    return row;
  }

  private async getAllCriteriaForExport(): Promise<ProgramQuestionForExport[]> {
    return (await this.programQuestionRepository.find())
      .map(c => {
        return {
          programQuestion: c.name,
          export: JSON.parse(JSON.stringify(c.export)),
        };
      })
      .concat(
        (await this.fspAttributeRepository.find()).map(c => {
          return {
            programQuestion: c.name,
            export: JSON.parse(JSON.stringify(c.export)),
          };
        }),
      );
  }

  private async addPaymentFieldsToExport(
    row: object,
    registration: RegistrationEntity,
    programId: number,
    installments: number[],
  ): Promise<object> {
    const voucherStatuses = [
      IntersolvePayoutStatus.InitialMessage,
      IntersolvePayoutStatus.VoucherSent,
    ];
    for await (let installment of installments) {
      const transaction = {};
      for await (let voucherStatus of voucherStatuses) {
        const input = {
          referenceId: registration.referenceId,
          programId: programId,
          installment: installment,
          customDataKey: 'IntersolvePayoutStatus',
          customDataValue: voucherStatus,
        };
        transaction[voucherStatus] = await this.getTransaction(input);
      }
      row[`payment${installment}_status`] =
        transaction[IntersolvePayoutStatus.InitialMessage]?.status;
      row[`payment${installment}_initialMessage_date`] =
        transaction[IntersolvePayoutStatus.InitialMessage]?.status ===
        StatusEnum.success
          ? transaction[IntersolvePayoutStatus.InitialMessage]?.installmentDate
          : null;
      row[`payment${installment}_voucherSent_date`] =
        transaction[IntersolvePayoutStatus.VoucherSent]?.status ===
        StatusEnum.success
          ? transaction[IntersolvePayoutStatus.VoucherSent]?.installmentDate
          : null;
    }
    return row;
  }

  private async getAllPeopleAffectedList(programId: number): Promise<FileDto> {
    const connections = await this.registrationRepository.find({
      relations: ['fsp'],
    });
    const criteria = await this.getAllCriteriaForExport();
    const installments = (await this.getInstallments(programId)).map(
      i => i.installment,
    );

    const connectionDetails = [];

    for await (let connection of connections) {
      let row = {};
      row = this.addProgramQuestionsToExport(
        row,
        criteria,
        connection,
        ExportType.allPeopleAffected,
      );
      row = this.addGenericFieldsToExport(row, connection);
      row = await this.addPaymentFieldsToExport(
        row,
        connection,
        programId,
        installments,
      );
      connectionDetails.push(row);
    }
    const response = {
      fileName: this.getExportFileName(ExportType.allPeopleAffected),
      data: this.jsonToCsv(connectionDetails),
    };

    return response;
  }

  private async getInclusionList(programId: number): Promise<FileDto> {
    const includedRegistrations = (
      await this.registrationRepository.find({ relations: ['fsp'] })
    ).filter(
      registration =>
        registration.registrationStatus === RegistrationStatusEnum.included,
    );

    const criteria = await this.getAllCriteriaForExport();

    const inclusionDetails = [];
    includedRegistrations.forEach(connection => {
      let row = {};
      row = this.addProgramQuestionsToExport(
        row,
        criteria,
        connection,
        ExportType.included,
      );
      row = this.addGenericFieldsToExport(row, connection);
      inclusionDetails.push(row);
    });
    const filteredColumnDetails = this.filterUnusedColumn(inclusionDetails);
    const response = {
      fileName: this.getExportFileName('inclusion-list'),
      data: this.jsonToCsv(filteredColumnDetails),
    };

    return response;
  }

  private filterUnusedColumn(columnDetails): object[] {
    const emptyColumns = [];
    for (let row of columnDetails) {
      for (let key in row) {
        if (row[key]) {
          emptyColumns.push(key);
        }
      }
    }
    const filteredColumns = [];
    for (let row of columnDetails) {
      for (let key in row) {
        if (!emptyColumns.includes(key)) {
          delete row[key];
        }
      }
      filteredColumns.push(row);
    }
    return filteredColumns;
  }

  private async getSelectedForValidationList(
    programId: number,
  ): Promise<FileDto> {
    const selectedRegistrations = (
      await this.registrationRepository.find({ relations: ['fsp'] })
    ).filter(
      registration =>
        registration.registrationStatus ===
        RegistrationStatusEnum.selectedForValidation,
    );

    const criteria = await this.getAllCriteriaForExport();

    const columnDetails = [];
    selectedRegistrations.forEach(connection => {
      let row = {};
      row = this.addProgramQuestionsToExport(
        row,
        criteria,
        connection,
        ExportType.selectedForValidation,
      );
      row = this.addGenericFieldsToExport(row, connection);
      columnDetails.push(row);
    });

    const filteredColumnDetails = this.filterUnusedColumn(columnDetails);
    const response = {
      fileName: this.getExportFileName(ExportType.selectedForValidation),
      data: this.jsonToCsv(filteredColumnDetails),
    };

    return response;
  }

  private async getDuplicatePhoneNumbers(programId: number): Promise<FileDto> {
    const allConnections = await this.registrationRepository.find({
      relations: ['fsp'],
      where: {
        program: { id: programId },
        customData: Not(IsNull()),
      },
    });

    const duplicates = allConnections.filter(connection => {
      const others = without(allConnections, connection);
      const currentPaNumbers = compact([
        connection.customData[CustomDataAttributes.phoneNumber],
        connection.customData[CustomDataAttributes.whatsappPhoneNumber],
      ]);

      const hasDuplicateProgramNr = this.hasDuplicateCustomDataValues(
        others,
        CustomDataAttributes.phoneNumber,
        currentPaNumbers,
      );

      if (hasDuplicateProgramNr) {
        // No need to look for other matches
        return true;
      }

      const hasDuplicateWhatsAppNr = this.hasDuplicateCustomDataValues(
        others,
        CustomDataAttributes.whatsappPhoneNumber,
        currentPaNumbers,
      );

      return hasDuplicateWhatsAppNr;
    });

    const result = sortBy(duplicates, 'id').map(registration => {
      return {
        id: registration.id,
        name: this.getName(registration.customData),
        status: registration.registrationStatus,
        fsp: registration.fsp ? registration.fsp.fsp : null,
        namePartnerOrganization: registration.namePartnerOrganization,
        phoneNumber: registration.customData[CustomDataAttributes.phoneNumber],
        whatsappPhoneNumber:
          registration.customData[CustomDataAttributes.whatsappPhoneNumber],
      };
    });

    return {
      fileName: this.getExportFileName(ExportType.duplicatePhoneNumbers),
      data: this.jsonToCsv(result),
    };
  }

  public getName(customData): string {
    if (customData[CustomDataAttributes.name]) {
      return customData[CustomDataAttributes.name];
    } else if (customData[CustomDataAttributes.firstName]) {
      return (
        customData[CustomDataAttributes.firstName] +
        (customData[CustomDataAttributes.secondName]
          ? ' ' + customData[CustomDataAttributes.secondName]
          : '') +
        (customData[CustomDataAttributes.thirdName]
          ? ' ' + customData[CustomDataAttributes.thirdName]
          : '')
      );
    } else if (customData[CustomDataAttributes.nameFirst]) {
      return (
        customData[CustomDataAttributes.nameFirst] +
        (customData[CustomDataAttributes.nameLast]
          ? ' ' + customData[CustomDataAttributes.nameLast]
          : '')
      );
    } else {
      return '';
    }
  }

  private hasDuplicateCustomDataValues(
    others: RegistrationEntity[],
    type: CustomDataAttributes,
    values: any[],
  ): boolean {
    return others.some(otherRegistration => {
      if (!otherRegistration.customData[type]) {
        return false;
      }
      return values.includes(otherRegistration.customData[type]);
    });
  }

  private async getPaymentDetailsInstallment(
    programId: number,
    installmentId: number,
  ): Promise<any> {
    const latestSuccessTransactionPerPa = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('transaction.connectionId', 'connectionId')
      .addSelect('MAX(transaction.created)', 'maxCreated')
      .where('transaction.program.id = :programId', { programId: programId })
      .andWhere('transaction.installment = :installmentId', {
        installmentId: installmentId,
      })
      .andWhere('transaction.status = :status', { status: StatusEnum.success })
      .groupBy('transaction.connectionId');

    const transactions = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select([
        'transaction.amount as "amount"',
        'transaction.installment as "installment"',
        'connection.phoneNumber as "phoneNumber"',
        'connection.customData as "customData"',
        'connection.namePartnerOrganization as "partnerOrganization"',
        'fsp.fsp AS financialServiceProvider',
      ])
      .innerJoin(
        '(' + latestSuccessTransactionPerPa.getQuery() + ')',
        'subquery',
        'transaction.connectionId = subquery."connectionId" AND transaction.created = subquery."maxCreated"',
      )
      .setParameters(latestSuccessTransactionPerPa.getParameters())
      .leftJoin('transaction.connection', 'connection')
      .leftJoin('connection.fsp', 'fsp')
      .getRawMany();

    return transactions;
  }

  private jsonToCsv(items: any[]): any[] | string {
    if (items.length === 0) {
      return '';
    }
    const cleanValues = (_key, value): any => (value === null ? '' : value);

    const columns = Object.keys(items[0]);

    let rows = items.map(row =>
      columns
        .map(fieldName => JSON.stringify(row[fieldName], cleanValues))
        .join(','),
    );

    rows.unshift(columns.join(',')); // Add header row

    return rows.join('\r\n');
  }

  private getExportFileName(base: string): string {
    return `${base}_${new Date().toISOString().substr(0, 10)}.csv`;
  }
}
