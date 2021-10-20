import { GetTransactionOutputDto } from '../payments/transactions/dto/get-transaction.dto';
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
import { without, compact, sortBy } from 'lodash';
import { StatusEnum } from '../shared/enum/status.enum';
import { TransactionEntity } from '../payments/transactions/transaction.entity';
import { PaMetrics, PaMetricsProperty } from './dto/pa-metrics.dto';
import { Attributes } from '../registration/dto/update-attribute.dto';
import { TotalIncluded } from './dto/total-included.dto';
import { PaymentStateSumDto } from './dto/payment-state-sum.dto';
import { PaymentsService } from '../payments/payments.service';
import { ProgramEntity } from '../programs/program.entity';
import { TransactionsService } from '../payments/transactions/transactions.service';
import { IntersolvePayoutStatus } from '../payments/fsp-integration/intersolve/enum/intersolve-payout-status.enum';

@Injectable()
export class ExportMetricsService {
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(ProgramQuestionEntity)
  private readonly programQuestionRepository: Repository<ProgramQuestionEntity>;
  @InjectRepository(FspAttributeEntity)
  private readonly fspAttributeRepository: Repository<FspAttributeEntity>;
  @InjectRepository(TransactionEntity)
  private readonly transactionRepository: Repository<TransactionEntity>;

  public constructor(
    private readonly actionService: ActionService,
    private readonly paymentsService: PaymentsService,
    private readonly transactionsService: TransactionsService,
    private readonly registrationsService: RegistrationsService,
  ) {}

  public getExportList(
    programId: number,
    type: ExportType,
    userId: number,
    minPayment: number | null = null,
    maxPayment: number | null = null,
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
        return this.getPaymentDetails(programId, minPayment, maxPayment);
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
    minPaymentId: number,
    maxPaymentId: number,
  ): Promise<FileDto> {
    let pastPaymentDetails = await this.getPaymentDetailsPayment(
      programId,
      minPaymentId,
      maxPaymentId,
    );

    if (pastPaymentDetails.length === 0) {
      return {
        fileName: `details-future-payment-${minPaymentId}.csv`,
        data: (await this.getInclusionList(programId)).data,
      };
    }

    pastPaymentDetails = await this.filterAttributesToExport(
      pastPaymentDetails,
    );

    const csvFile = {
      fileName: `details-completed-payment-${
        minPaymentId === maxPaymentId
          ? minPaymentId
          : `${minPaymentId}-to-${maxPaymentId}`
      }.csv`,
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
    const unusedVouchers = await this.paymentsService.getUnusedVouchers();
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
    payments: number[],
    transactions: any[],
  ): Promise<object> {
    const voucherStatuses = [
      IntersolvePayoutStatus.InitialMessage,
      IntersolvePayoutStatus.VoucherSent,
    ];
    for await (let payment of payments) {
      const transaction = {};
      for await (let voucherStatus of voucherStatuses) {
        transaction[voucherStatus] = transactions.find(
          t =>
            t.payment === payment &&
            t.referenceId === registration.referenceId &&
            t.customData['IntersolvePayoutStatus'] === voucherStatus,
        );
      }
      let creationTransaction: GetTransactionOutputDto;
      if (transaction[IntersolvePayoutStatus.InitialMessage]) {
        creationTransaction =
          transaction[IntersolvePayoutStatus.InitialMessage];
      } else {
        creationTransaction = transactions.find(
          t =>
            t.payment === payment &&
            t.referenceId === registration.referenceId &&
            !t.customData['IntersolvePayoutStatus'],
        );
      }
      row[`payment${payment}_status`] = creationTransaction?.status;
      row[`payment${payment}_voucherCreated_date`] =
        creationTransaction?.status === StatusEnum.success
          ? creationTransaction?.paymentDate
          : null;
      row[`payment${payment}_voucherSent_date`] =
        transaction[IntersolvePayoutStatus.VoucherSent]?.status ===
        StatusEnum.success
          ? transaction[IntersolvePayoutStatus.VoucherSent]?.paymentDate
          : null;
    }
    return row;
  }

  private async getAllPeopleAffectedList(programId: number): Promise<FileDto> {
    const registrations = await this.registrationRepository.find({
      relations: ['fsp'],
    });
    const questions = await this.getAllQuestionsForExport();
    const payments = (await this.paymentsService.getPayments(programId))
      .map(i => i.payment)
      .sort((a, b) => (a > b ? 1 : -1));
    const registrationDetails = [];

    const transactions = await this.transactionsService.getTransactions(
      programId,
      true,
    );

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
        payments,
        transactions,
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

  private async getPaymentDetailsPayment(
    programId: number,
    minPaymentId: number,
    maxPaymentId: number,
  ): Promise<any> {
    const latestSuccessTransactionPerPa = await this.transactionRepository

      .createQueryBuilder('transaction')
      .select('transaction.registrationId', 'registrationId')
      .addSelect('transaction.payment', 'payment')
      .addSelect('MAX(transaction.created)', 'maxCreated')
      .where('transaction.program.id = :programId', { programId: programId })
      .andWhere('transaction.payment between :minPaymentId and :maxPaymentId', {
        minPaymentId: minPaymentId,
        maxPaymentId: maxPaymentId,
      })
      .andWhere('transaction.status = :status', { status: StatusEnum.success })
      .groupBy('transaction.registrationId')
      .addGroupBy('transaction.payment');

    const transactions = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select([
        'transaction.amount as "amount"',
        'transaction.payment as "payment"',
        'registration.phoneNumber as "phoneNumber"',
        'registration.customData as "customData"',
        'registration.namePartnerOrganization as "partnerOrganization"',
        'fsp.fsp AS financialServiceProvider',
      ])
      .innerJoin(
        '(' + latestSuccessTransactionPerPa.getQuery() + ')',
        'subquery',
        'transaction.registrationId = subquery."registrationId" AND transaction.payment = subquery.payment AND transaction.created = subquery."maxCreated"',
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
    payment?: number,
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
        payment,
        month,
        year,
        fromStart,
      ),
      [RegistrationStatusEnum.invited]: await this.getTimestampsPerStatusAndTimePeriod(
        programId,
        registrations,
        RegistrationStatusEnum.invited,
        payment,
        month,
        year,
        fromStart,
      ),
      [RegistrationStatusEnum.startedRegistration]: await this.getTimestampsPerStatusAndTimePeriod(
        programId,
        registrations,
        RegistrationStatusEnum.startedRegistration,
        payment,
        month,
        year,
        fromStart,
      ),
      [RegistrationStatusEnum.registered]: await this.getTimestampsPerStatusAndTimePeriod(
        programId,
        registrations,
        RegistrationStatusEnum.registered,
        payment,
        month,
        year,
        fromStart,
      ),
      [RegistrationStatusEnum.selectedForValidation]: await this.getTimestampsPerStatusAndTimePeriod(
        programId,
        registrations,
        RegistrationStatusEnum.selectedForValidation,
        payment,
        month,
        year,
        fromStart,
      ),
      [RegistrationStatusEnum.validated]: await this.getTimestampsPerStatusAndTimePeriod(
        programId,
        registrations,
        RegistrationStatusEnum.validated,
        payment,
        month,
        year,
      ),
      [RegistrationStatusEnum.included]: await this.getTimestampsPerStatusAndTimePeriod(
        programId,
        registrations,
        RegistrationStatusEnum.included,
        payment,
        month,
        year,
        fromStart,
      ),
      [RegistrationStatusEnum.inclusionEnded]: await this.getTimestampsPerStatusAndTimePeriod(
        programId,
        registrations,
        RegistrationStatusEnum.inclusionEnded,
        payment,
        month,
        year,
        fromStart,
      ),
      [RegistrationStatusEnum.noLongerEligible]: await this.getTimestampsPerStatusAndTimePeriod(
        programId,
        registrations,
        RegistrationStatusEnum.noLongerEligible,
        payment,
        month,
        year,
      ),
      [RegistrationStatusEnum.rejected]: await this.getTimestampsPerStatusAndTimePeriod(
        programId,
        registrations,
        RegistrationStatusEnum.rejected,
        payment,
        month,
        year,
        fromStart,
      ),
      [PaMetricsProperty.totalPaHelped]: await this.getTotalPaHelped(
        programId,
        payment,
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
    payment?: number,
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

    if (payment) {
      const payments = await this.paymentsService.getPayments(programId);
      const beginDate =
        payment === 1 || (fromStart && fromStart === 1)
          ? new Date(2000, 0, 1)
          : payments.find(i => i.payment === payment - 1).paymentDate;
      const endDate = payments.find(i => i.payment === payment).paymentDate;
      filteredRegistrations = filteredRegistrations.filter(
        registration =>
          registration[dateColumn] > beginDate &&
          registration[dateColumn] <= endDate,
      );
    }
    return filteredRegistrations.length;
  }

  public async getTotalPaHelped(
    programId: number,
    payment?: number,
    month?: number,
    year?: number,
    fromStart?: number,
  ): Promise<number> {
    let query = this.registrationRepository
      .createQueryBuilder('registration')
      .innerJoinAndSelect('registration.transactions', 'transactions');
    let yearMonthStartCondition;
    if (month >= 0 && year) {
      yearMonthStartCondition = new Date(year, month, 1, 0, 0, 0);
      let yearMonthEndCondition;
      if (fromStart || !(year || month)) {
        yearMonthEndCondition = new Date(3000, month + 1, 1, 0, 0, 0);
      } else {
        yearMonthEndCondition = new Date(year, month + 1, 1, 0, 0);
      }
      query = query
        .where('transactions.created > :yearMonthStartCondition', {
          yearMonthStartCondition: yearMonthStartCondition,
        })
        .where('transactions.created < :yearMonthEndCondition', {
          yearMonthEndCondition: yearMonthEndCondition,
        });
    }
    if (payment) {
      if (fromStart) {
        query = query.where('transactions.payment >= :payment', {
          payment: payment,
        });
      } else {
        query = query.where('transactions.payment = :payment', {
          payment: payment,
        });
      }
    }
    return await query.getCount();
  }

  public async getPaymentsWithStateSums(
    programId: number,
  ): Promise<PaymentStateSumDto[]> {
    const totalProcessedPayments = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('MAX(transaction.payment)')
      .getRawOne();
    const program = await this.programRepository.findOne(programId);
    const paymentNrSearch = Math.max(
      ...[totalProcessedPayments.max, program.distributionDuration],
    );
    const paymentsWithStats = [];
    let i = 1;
    const transactionStepMin = await await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('MIN(transaction.transactionStep)')
      .getRawOne();
    while (i <= paymentNrSearch) {
      const result = await this.getOnePaymentWithStateSum(
        programId,
        i,
        transactionStepMin.min,
      );
      paymentsWithStats.push(result);
      i++;
    }
    return paymentsWithStats;
  }

  public async getOnePaymentWithStateSum(
    programId: number,
    payment: number,
    transactionStepOfInterest: number,
  ): Promise<PaymentStateSumDto> {
    const currentPaymentRegistrationsAndCount = await this.transactionRepository.findAndCount(
      {
        where: {
          program: { id: programId },
          status: StatusEnum.success,
          payment: payment,
          transactionStep: transactionStepOfInterest,
        },
        relations: ['registration'],
      },
    );
    const currentPaymentRegistrations = currentPaymentRegistrationsAndCount[0];
    const currentPaymentCount = currentPaymentRegistrationsAndCount[1];
    const currentPaymentRegistrationsIds = currentPaymentRegistrations.map(
      ({ registration }) => registration.id,
    );
    let preExistingPa: number;
    if (currentPaymentCount > 0) {
      preExistingPa = await this.transactionRepository
        .createQueryBuilder('transaction')
        .leftJoin('transaction.registration', 'registration')
        .where('transaction.registration.id IN (:...registrationIds)', {
          registrationIds: currentPaymentRegistrationsIds,
        })
        .andWhere('transaction.payment = :payment', {
          payment: payment - 1,
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
      id: payment,
      values: {
        'pre-existing': preExistingPa,
        new: currentPaymentCount - preExistingPa,
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
    const includedRegistrations = await this.registrationRepository.find({
      where: {
        program: { id: programId },
        registrationStatus: RegistrationStatusEnum.included,
      },
      relations: ['fsp'],
    });
    const sum = includedRegistrations.reduce(function(a, b) {
      return a + (b[Attributes.paymentAmountMultiplier] || 1);
    }, 0);
    return {
      registrations: includedRegistrations.length,
      transferAmounts: sum,
    };
  }
}
