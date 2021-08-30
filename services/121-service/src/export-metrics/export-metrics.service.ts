import { GetTransactionOutputDto } from '../programs/dto/get-transaction.dto';
import { RegistrationResponse } from '../registration/dto/registration-response.model';
import { RegistrationsService } from './../registration/registrations.service';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository, getRepository } from 'typeorm';
import { RegistrationEntity } from '../registration/registration.entity';
import { RegistrationStatusEnum } from '../registration/enum/registration-status.enum';
import {
  CustomDataAttributes,
  GenericAttributes,
} from '../registration/enum/custom-data-attributes';
import { ProgramQuestionEntity } from '../programs/program-question.entity';
import { FspAttributeEntity } from '../fsp/fsp-attribute.entity';
import { ActionService } from '../actions/action.service';
import { ExportType } from './dto/export-details';
import { FileDto } from './dto/file.dto';
import { ProgramQuestionForExport } from '../programs/dto/program-question-for-export.dto';
import { IntersolvePayoutStatus } from '../fsp/api/enum/intersolve-payout-status.enum';
import { without, compact, sortBy } from 'lodash';
import { StatusEnum } from '../shared/enum/status.enum';
import { TransactionEntity } from '../programs/transactions.entity';
import { ProgramService } from '../programs/programs.service';
import { FspService } from '../fsp/fsp.service';
import { PaMetrics } from './dto/pa-metrics.dto';
import { Attributes } from '../registration/dto/update-attribute.dto';
import { TotalIncluded } from './dto/total-included.dto';
import { InstallmentStateSumDto } from './dto/installment-state-sum.dto';

@Injectable()
export class ExportMetricsService {
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;
  @InjectRepository(ProgramQuestionEntity)
  private readonly programQuestionRepository: Repository<ProgramQuestionEntity>;
  @InjectRepository(FspAttributeEntity)
  private readonly fspAttributeRepository: Repository<FspAttributeEntity>;
  @InjectRepository(TransactionEntity)
  private readonly transactionRepository: Repository<TransactionEntity>;

  public constructor(
    private readonly actionService: ActionService,
    private readonly programService: ProgramService,
    private readonly fspService: FspService,
    private readonly registrationsService: RegistrationsService,
  ) {}

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
    const programQuestions = (await this.getAllQuestionsForExport()).map(
      c => c.programQuestion,
    );
    const outputPaymentDetails = [];
    pastPaymentDetails.forEach(transaction => {
      Object.keys(transaction.customData).forEach(key => {
        if (programQuestions.includes(key)) {
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
      v.name = this.registrationsService.getName(v.customData);
      delete v.customData;
    });

    const response = {
      fileName: this.getExportFileName(ExportType.unusedVouchers),
      data: this.jsonToCsv(unusedVouchers),
    };

    return response;
  }

  private async addGenericFieldsToExport(
    row: object,
    registration: RegistrationEntity,
  ): Promise<object> {
    const genericFields = [
      'id',
      GenericAttributes.phoneNumber,
      GenericAttributes.namePartnerOrganization,
      GenericAttributes.paymentAmountMultiplier,
      'note',
    ];
    genericFields.forEach(field => {
      row[field] = registration[field];
    });

    row['status'] = registration.registrationStatus;
    row['financialServiceProvider'] = registration.fsp?.fsp;

    const registrationStatuses = Object.values(
      RegistrationStatusEnum,
    ).map(item => String(item));
    for await (let status of registrationStatuses) {
      const dateField = this.registrationsService.getDateColumPerStatus(
        RegistrationStatusEnum[status],
      );
      row[
        dateField
      ] = await this.registrationsService.getLatestDateForRegistrationStatus(
        registration,
        RegistrationStatusEnum[status],
      );
    }

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

  private async getAllQuestionsForExport(): Promise<
    ProgramQuestionForExport[]
  > {
    return (await this.programQuestionRepository.find())
      .map(question => {
        return {
          programQuestion: question.name,
          export: JSON.parse(JSON.stringify(question.export)),
        };
      })
      .concat(
        (await this.fspAttributeRepository.find()).map(question => {
          return {
            programQuestion: question.name,
            export: JSON.parse(JSON.stringify(question.export)),
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
        transaction[voucherStatus] = await this.programService.getTransaction(
          input,
        );
      }
      let creationTransaction: GetTransactionOutputDto;
      if (transaction[IntersolvePayoutStatus.InitialMessage]) {
        creationTransaction =
          transaction[IntersolvePayoutStatus.InitialMessage];
      } else {
        creationTransaction = await this.programService.getTransaction({
          referenceId: registration.referenceId,
          programId: programId,
          installment: installment,
          customDataKey: null,
          customDataValue: null,
        });
      }
      row[`payment${installment}_status`] =
        transaction[IntersolvePayoutStatus.InitialMessage]?.status;
      row[`payment${installment}_voucherCreated_date`] =
        creationTransaction?.status === StatusEnum.success
          ? creationTransaction?.installmentDate
          : null;
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
    const registrations = await this.registrationRepository.find({
      relations: ['fsp'],
    });
    const questions = await this.getAllQuestionsForExport();
    const installments = (
      await this.programService.getInstallments(programId)
    ).map(i => i.installment);

    const registrationDetails = [];

    for await (let registration of registrations) {
      let row = {};
      row = this.addProgramQuestionsToExport(
        row,
        questions,
        registration,
        ExportType.allPeopleAffected,
      );
      row = await this.addGenericFieldsToExport(row, registration);
      row = await this.addPaymentFieldsToExport(
        row,
        registration,
        programId,
        installments,
      );
      registrationDetails.push(row);
    }
    const response = {
      fileName: this.getExportFileName(ExportType.allPeopleAffected),
      data: this.jsonToCsv(registrationDetails),
    };

    return response;
  }

  private async getInclusionList(programId: number): Promise<FileDto> {
    const includedRegistrations = await this.registrationRepository.find({
      where: {
        program: { id: programId },
        registrationStatus: RegistrationStatusEnum.included,
      },
      relations: ['fsp'],
    });
    const questions = await this.getAllQuestionsForExport();
    const inclusionDetails = [];
    for await (let registration of includedRegistrations) {
      let row = {};
      row = this.addProgramQuestionsToExport(
        row,
        questions,
        registration,
        ExportType.included,
      );
      row = await this.addGenericFieldsToExport(row, registration);
      inclusionDetails.push(row);
    }
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

    const programQuestions = await this.getAllQuestionsForExport();

    const columnDetails = [];
    for await (let registration of selectedRegistrations) {
      let row = {};
      row = this.addProgramQuestionsToExport(
        row,
        programQuestions,
        registration,
        ExportType.selectedForValidation,
      );
      row = await this.addGenericFieldsToExport(row, registration);
      columnDetails.push(row);
    }

    const filteredColumnDetails = this.filterUnusedColumn(columnDetails);
    const response = {
      fileName: this.getExportFileName(ExportType.selectedForValidation),
      data: this.jsonToCsv(filteredColumnDetails),
    };

    return response;
  }

  private async getDuplicatePhoneNumbers(programId: number): Promise<FileDto> {
    const allRegistrations = await this.registrationRepository.find({
      relations: ['fsp'],
      where: {
        program: { id: programId },
        customData: Not(IsNull()),
      },
    });

    const duplicates = allRegistrations.filter(registration => {
      const others = without(allRegistrations, registration);
      const currentPaNumbers = compact([
        registration.customData[CustomDataAttributes.phoneNumber],
        registration.customData[CustomDataAttributes.whatsappPhoneNumber],
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
        name: this.registrationsService.getName(registration.customData),
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
      .select('transaction.registrationId', 'registrationId')
      .addSelect('MAX(transaction.created)', 'maxCreated')
      .where('transaction.program.id = :programId', { programId: programId })
      .andWhere('transaction.installment = :installmentId', {
        installmentId: installmentId,
      })
      .andWhere('transaction.status = :status', { status: StatusEnum.success })
      .groupBy('transaction.registrationId');

    const transactions = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select([
        'transaction.amount as "amount"',
        'transaction.installment as "installment"',
        'registration.phoneNumber as "phoneNumber"',
        'registration.customData as "customData"',
        'registration.namePartnerOrganization as "partnerOrganization"',
        'fsp.fsp AS financialServiceProvider',
      ])
      .innerJoin(
        '(' + latestSuccessTransactionPerPa.getQuery() + ')',
        'subquery',
        'transaction.registrationId = subquery."registrationId" AND transaction.created = subquery."maxCreated"',
      )
      .setParameters(latestSuccessTransactionPerPa.getParameters())
      .leftJoin('transaction.registration', 'registration')
      .leftJoin('registration.fsp', 'fsp')
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

  public async getPaMetrics(
    programId: number,
    installment?: number,
    month?: number,
    year?: number,
    fromStart?: number,
  ): Promise<PaMetrics> {
    const registrations = await this.registrationsService.getRegistrationsForProgram(
      programId,
      false,
    );

    const metrics: PaMetrics = {
      [RegistrationStatusEnum.imported]: await this.getTimestampsPerStatusAndTimePeriod(
        programId,
        registrations,
        RegistrationStatusEnum.imported,
        installment,
        month,
        year,
        fromStart,
      ),
      [RegistrationStatusEnum.invited]: await this.getTimestampsPerStatusAndTimePeriod(
        programId,
        registrations,
        RegistrationStatusEnum.invited,
        installment,
        month,
        year,
        fromStart,
      ),
      [RegistrationStatusEnum.startedRegistration]: await this.getTimestampsPerStatusAndTimePeriod(
        programId,
        registrations,
        RegistrationStatusEnum.startedRegistration,
        installment,
        month,
        year,
        fromStart,
      ),
      [RegistrationStatusEnum.registered]: await this.getTimestampsPerStatusAndTimePeriod(
        programId,
        registrations,
        RegistrationStatusEnum.registered,
        installment,
        month,
        year,
        fromStart,
      ),
      [RegistrationStatusEnum.selectedForValidation]: await this.getTimestampsPerStatusAndTimePeriod(
        programId,
        registrations,
        RegistrationStatusEnum.selectedForValidation,
        installment,
        month,
        year,
        fromStart,
      ),
      [RegistrationStatusEnum.validated]: await this.getTimestampsPerStatusAndTimePeriod(
        programId,
        registrations,
        RegistrationStatusEnum.validated,
        installment,
        month,
        year,
      ),
      [RegistrationStatusEnum.included]: await this.getTimestampsPerStatusAndTimePeriod(
        programId,
        registrations,
        RegistrationStatusEnum.included,
        installment,
        month,
        year,
        fromStart,
      ),
      [RegistrationStatusEnum.inclusionEnded]: await this.getTimestampsPerStatusAndTimePeriod(
        programId,
        registrations,
        RegistrationStatusEnum.inclusionEnded,
        installment,
        month,
        year,
        fromStart,
      ),
      [RegistrationStatusEnum.noLongerEligible]: await this.getTimestampsPerStatusAndTimePeriod(
        programId,
        registrations,
        RegistrationStatusEnum.noLongerEligible,
        installment,
        month,
        year,
      ),
      [RegistrationStatusEnum.rejected]: await this.getTimestampsPerStatusAndTimePeriod(
        programId,
        registrations,
        RegistrationStatusEnum.rejected,
        installment,
        month,
        year,
        fromStart,
      ),
    };

    return metrics;
  }

  private async getTimestampsPerStatusAndTimePeriod(
    programId: number,
    registrations: RegistrationResponse[],
    filterStatus: RegistrationStatusEnum,
    installment?: number,
    month?: number,
    year?: number,
    fromStart?: number,
  ): Promise<number> {
    const dateColumn = this.registrationsService.getDateColumPerStatus(
      filterStatus,
    );

    let filteredRegistrations = registrations.filter(
      registration => !!registration[dateColumn],
    );

    if (
      (typeof month !== 'undefined' && year === undefined) ||
      (typeof year !== 'undefined' && month === undefined)
    ) {
      throw new HttpException(
        'Please provide both month AND year',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (month >= 0 && year) {
      filteredRegistrations = filteredRegistrations.filter(registration => {
        const yearMonth = new Date(
          registration[dateColumn].getFullYear(),
          registration[dateColumn].getUTCMonth(),
          1,
        );
        const yearMonthCondition = new Date(year, month, 1);
        if (fromStart && fromStart === 1) {
          return yearMonth <= yearMonthCondition;
        } else {
          return yearMonth.getTime() === yearMonthCondition.getTime();
        }
      });
    }

    if (installment) {
      const installments = await this.programService.getInstallments(programId);
      const beginDate =
        installment === 1 || (fromStart && fromStart === 1)
          ? new Date(2000, 0, 1)
          : installments.find(i => i.installment === installment - 1)
              .installmentDate;
      const endDate = installments.find(i => i.installment === installment)
        .installmentDate;
      filteredRegistrations = filteredRegistrations.filter(
        registration =>
          registration[dateColumn] > beginDate &&
          registration[dateColumn] <= endDate,
      );
    }
    return filteredRegistrations.length;
  }

  public async getInstallmentsWithStateSums(
    programId: number,
  ): Promise<InstallmentStateSumDto[]> {
    const totalProcessedInstallments = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('MAX(transaction.installment)')
      .getRawOne();
    const program = await this.programService.findOne(programId);
    const installmentNrSearch = Math.max(
      ...[totalProcessedInstallments.max, program.distributionDuration],
    );
    const installmentsWithStats = [];
    let i = 1;
    const transactionStepMin = await await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('MIN(transaction.transactionStep)')
      .getRawOne();
    while (i <= installmentNrSearch) {
      const result = await this.getOneInstallmentWithStateSum(
        programId,
        i,
        transactionStepMin.min,
      );
      installmentsWithStats.push(result);
      i++;
    }
    return installmentsWithStats;
  }

  public async getOneInstallmentWithStateSum(
    programId: number,
    installment: number,
    transactionStepOfInterest: number,
  ): Promise<InstallmentStateSumDto> {
    const currentInstallmentRegistrationsAndCount = await this.transactionRepository.findAndCount(
      {
        where: {
          program: { id: programId },
          status: StatusEnum.success,
          installment: installment,
          transactionStep: transactionStepOfInterest,
        },
        relations: ['registration'],
      },
    );
    const currentInstallmentRegistrations =
      currentInstallmentRegistrationsAndCount[0];
    const currentInstallmentCount = currentInstallmentRegistrationsAndCount[1];
    const currentInstallmentRegistrationsIds = currentInstallmentRegistrations.map(
      ({ registration }) => registration.id,
    );
    let preExistingPa: number;
    if (currentInstallmentCount > 0) {
      preExistingPa = await this.transactionRepository
        .createQueryBuilder('transaction')
        .leftJoin('transaction.registration', 'registration')
        .where('transaction.registration.id IN (:...registrationIds)', {
          registrationIds: currentInstallmentRegistrationsIds,
        })
        .andWhere('transaction.installment = :installment', {
          installment: installment - 1,
        })
        .andWhere('transaction.status = :status', {
          status: StatusEnum.success,
        })
        .andWhere('transaction.transactionStep = :transactionStep', {
          transactionStep: transactionStepOfInterest,
        })
        .andWhere('transaction.programId = :programId', {
          programId: programId,
        })
        .getCount();
    } else {
      preExistingPa = 0;
    }
    return {
      id: installment,
      values: {
        'pre-existing': preExistingPa,
        new: currentInstallmentCount - preExistingPa,
      },
    };
  }

  public async getMonitoringData(programId: number): Promise<any> {
    const registrations = await this.queryMonitoringData(programId);
    return registrations.map(registration => {
      const startDate = new Date(
        registration['statusChangeStarted_created'],
      ).getTime();
      const registeredDate = new Date(
        registration['statusChangeRegistered_created'],
      ).getTime();
      const durationSeconds = (registeredDate - startDate) / 1000;
      return {
        monitoringAnswer:
          registration['registration_customData']['monitoringAnswer'],
        registrationDuration: durationSeconds,
        status: registration['registration_registrationStatus'],
      };
    });
  }

  private async queryMonitoringData(programId: number): Promise<any[]> {
    const q = getRepository(RegistrationEntity)
      .createQueryBuilder('registration')
      .innerJoinAndSelect(
        'registration.program',
        'program',
        'program.id = :programId',
        {
          programId: programId,
        },
      )
      .innerJoinAndSelect('registration.fsp', 'fsp.registrations')
      .innerJoinAndSelect(
        'registration.statusChanges',
        'statusChangeStarted',
        'registration.id = "statusChangeStarted"."registrationId"',
      )
      .innerJoinAndSelect(
        'registration.statusChanges',
        'statusChangeRegistered',
        'registration.id = "statusChangeRegistered"."registrationId"',
      )
      .where('"statusChangeStarted"."registrationStatus" = :statusstarted', {
        statusstarted: RegistrationStatusEnum.startedRegistration,
      })
      .andWhere(
        '"statusChangeRegistered"."registrationStatus" = :statusregister',
        {
          statusregister: RegistrationStatusEnum.registered,
        },
      )
      .orderBy('"statusChangeRegistered".created', 'DESC')
      .orderBy('"statusChangeStarted".created', 'DESC')
      .orderBy('"registration"."inclusionScore"', 'DESC')
      .orderBy('"registration"."id"', 'DESC')
      .distinctOn(['registration.id']);
    return await q.getRawMany();
  }

  public async getTotalIncluded(programId: number): Promise<TotalIncluded> {
    const includedRegistrations = await this.programService.getIncludedRegistrations(
      programId,
    );
    const sum = includedRegistrations.reduce(function(a, b) {
      return a + (b[Attributes.paymentAmountMultiplier] || 1);
    }, 0);
    return {
      registrations: includedRegistrations.length,
      transferAmounts: sum,
    };
  }
}
