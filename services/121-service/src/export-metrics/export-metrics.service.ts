import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { uniq, without } from 'lodash';
import { ReferenceIdsDto } from 'src/registration/dto/reference-id.dto';
import { Connection, getRepository, In, Repository } from 'typeorm';
import { ActionService } from '../actions/action.service';
import { FspQuestionEntity } from '../fsp/fsp-question.entity';
import { IntersolvePayoutStatus } from '../payments/fsp-integration/intersolve/enum/intersolve-payout-status.enum';
import { PaymentsService } from '../payments/payments.service';
import { GetTransactionOutputDto } from '../payments/transactions/dto/get-transaction.dto';
import { TransactionEntity } from '../payments/transactions/transaction.entity';
import { TransactionsService } from '../payments/transactions/transactions.service';
import { ProgramQuestionEntity } from '../programs/program-question.entity';
import { ProgramEntity } from '../programs/program.entity';
import { RegistrationResponse } from '../registration/dto/registration-response.model';
import { Attributes } from '../registration/dto/update-attribute.dto';
import {
  AnswerTypes,
  GenericAttributes,
} from '../registration/enum/custom-data-attributes';
import { RegistrationStatusEnum } from '../registration/enum/registration-status.enum';
import { RegistrationDataEntity } from '../registration/registration-data.entity';
import { RegistrationEntity } from '../registration/registration.entity';
import { StatusEnum } from '../shared/enum/status.enum';
import { ProgramCustomAttributeEntity } from './../programs/program-custom-attribute.entity';
import { RegistrationDataOptions } from './../registration/dto/registration-data-relation.model';
import { CustomDataAttributes } from './../registration/enum/custom-data-attributes';
import { RegistrationsService } from './../registration/registrations.service';
import { ExportType } from './dto/export-details';
import { FileDto } from './dto/file.dto';
import { PaMetrics, PaMetricsProperty } from './dto/pa-metrics.dto';
import { PaymentStateSumDto } from './dto/payment-state-sum.dto';
import { ProgramStats } from './dto/program-stats.dto';
import { TotalTransferAmounts } from './dto/total-transfer-amounts.dto';

@Injectable()
export class ExportMetricsService {
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;
  @InjectRepository(RegistrationDataEntity)
  private readonly registrationDataRepository: Repository<
    RegistrationDataEntity
  >;
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(ProgramQuestionEntity)
  private readonly programQuestionRepository: Repository<ProgramQuestionEntity>;
  @InjectRepository(FspQuestionEntity)
  private readonly fspQuestionRepository: Repository<FspQuestionEntity>;
  @InjectRepository(TransactionEntity)
  private readonly transactionRepository: Repository<TransactionEntity>;

  public constructor(
    private readonly actionService: ActionService,
    private readonly paymentsService: PaymentsService,
    private readonly transactionsService: TransactionsService,
    private readonly registrationsService: RegistrationsService,
    private readonly connection: Connection,
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
      case ExportType.toCancelVouchers: {
        return this.getToCancelVouchers();
      }
      case ExportType.duplicates: {
        return this.getDuplicates(programId);
      }
    }
  }

  private async getAllPeopleAffectedList(programId: number): Promise<FileDto> {
    const data = await this.getRegistrationsList(
      programId,
      ExportType.allPeopleAffected,
      null,
      true,
    );
    const response = {
      fileName: ExportType.allPeopleAffected,
      data: data,
    };
    return response;
  }

  private async getInclusionList(programId: number): Promise<FileDto> {
    const data = await this.getRegistrationsList(
      programId,
      ExportType.included,
      RegistrationStatusEnum.included,
      false,
    );
    const response = {
      fileName: 'inclusion-list',
      data: data,
    };
    return response;
  }

  private async getSelectedForValidationList(
    programId: number,
  ): Promise<FileDto> {
    const data = await this.getRegistrationsList(
      programId,
      ExportType.selectedForValidation,
      RegistrationStatusEnum.selectedForValidation,
      false,
    );
    const response = {
      fileName: ExportType.selectedForValidation,
      data: data,
    };
    return response;
  }

  private async getPaymentDetails(
    programId: number,
    minPaymentId: number,
    maxPaymentId: number,
  ): Promise<FileDto> {
    const relationOptions = await this.getRelationOptionsForExport(
      programId,
      ExportType.included,
    );
    let pastPaymentDetails = await this.getPaymentDetailsPayment(
      programId,
      minPaymentId,
      maxPaymentId,
      relationOptions,
    );
    if (pastPaymentDetails.length === 0) {
      return {
        fileName: `details-included-people-affected-${minPaymentId}`,
        data: (await this.getInclusionList(programId)).data,
      };
    }
    const fileInput = {
      fileName: `details-completed-payment-${
        minPaymentId === maxPaymentId
          ? minPaymentId
          : `${minPaymentId}-to-${maxPaymentId}`
      }`,
      data: pastPaymentDetails,
    };

    return fileInput;
  }

  private async getRegistrationsList(
    programId: number,
    exportType: ExportType,
    registrationStatus?: RegistrationStatusEnum,
    addPaymentColumns?: boolean,
  ): Promise<object[]> {
    const relationOptions = await this.getRelationOptionsForExport(
      programId,
      exportType,
    );
    const rows = await this.getRegistrationsGenericFields(
      programId,
      relationOptions,
      registrationStatus,
    );

    let payments;
    let transactions;
    if (addPaymentColumns) {
      payments = (await this.paymentsService.getPayments(programId))
        .map(i => i.payment)
        .sort((a, b) => (a > b ? 1 : -1));

      transactions = await this.transactionsService.getTransactions(
        programId,
        true,
      );
    }

    for await (let row of rows) {
      await this.addRegistrationStatussesToExport(row);
      if (addPaymentColumns) {
        await this.addPaymentFieldsToExport(row, payments, transactions);
      }
      delete row['referenceId'];
    }
    await this.replaceValueWithDropdownLabel(rows, relationOptions);

    return this.filterUnusedColumn(rows);
  }

  private async getRelationOptionsForExport(
    programId: number,
    exportType: ExportType,
  ): Promise<RegistrationDataOptions[]> {
    const relationOptions = [];
    const program = await this.programRepository.findOne(programId, {
      relations: [
        'programQuestions',
        'financialServiceProviders',
        'financialServiceProviders.questions',
      ],
    });
    const programCustomAttrs = await this.getAllProgramCustomAttributesForExport(
      programId,
    );
    for (const programCustomAttr of programCustomAttrs) {
      const relationOption = new RegistrationDataOptions();
      relationOption.name = programCustomAttr.name;
      relationOption.relation = {
        programCustomAttributeId: programCustomAttr.id,
      };
      relationOptions.push(relationOption);
    }
    for (const programQuestion of program.programQuestions) {
      if (
        JSON.parse(JSON.stringify(programQuestion.export)).includes(
          exportType,
        ) &&
        programQuestion.name !== CustomDataAttributes.phoneNumber // Phonenumber is exclude because it is already a registration entity attribute
      ) {
        const relationOption = new RegistrationDataOptions();
        relationOption.name = programQuestion.name;
        relationOption.relation = { programQuestionId: programQuestion.id };
        relationOptions.push(relationOption);
      }
    }
    let fspQuestions = [];
    for (const fsp of program.financialServiceProviders) {
      fspQuestions = fspQuestions.concat(fsp.questions);
    }
    for (const fspQuestion of fspQuestions) {
      if (
        JSON.parse(JSON.stringify(fspQuestion.export)).includes(exportType) &&
        fspQuestion.name !== CustomDataAttributes.phoneNumber // Phonenumber is exclude because it is already a registration entity attribute
      ) {
        const relationOption = new RegistrationDataOptions();
        relationOption.name = fspQuestion.name;
        relationOption.relation = { fspQuestionId: fspQuestion.id };
        relationOptions.push(relationOption);
      }
    }
    return relationOptions;
  }

  private getRelationOptionsForDuplicates(
    programQuestions: ProgramQuestionEntity[],
    fspQuestions: FspQuestionEntity[],
  ): RegistrationDataOptions[] {
    const relationOptions = [];
    for (const programQuestion of programQuestions) {
      const relationOption = new RegistrationDataOptions();
      relationOption.name = programQuestion.name;
      relationOption.relation = { programQuestionId: programQuestion.id };
      relationOptions.push(relationOption);
    }

    for (const fspQuestion of fspQuestions) {
      const relationOption = new RegistrationDataOptions();
      relationOption.name = fspQuestion.name;
      relationOption.relation = { fspQuestionId: fspQuestion.id };
      relationOptions.push(relationOption);
    }
    return relationOptions;
  }

  private async getUnusedVouchers(): Promise<FileDto> {
    const unusedVouchers = await this.paymentsService.getUnusedVouchers();
    for (const v of unusedVouchers) {
      const registration = await this.registrationsService.getRegistrationFromReferenceId(
        v.referenceId,
      );
      v.name = await registration.getFullName();
      delete v.referenceId;
    }

    const response = {
      fileName: ExportType.unusedVouchers,
      data: unusedVouchers,
    };

    return response;
  }

  private async getToCancelVouchers(): Promise<FileDto> {
    const toCancelVouchers = await this.paymentsService.getToCancelVouchers();

    const response = {
      fileName: ExportType.toCancelVouchers,
      data: toCancelVouchers,
    };

    return response;
  }

  private async addRegistrationStatussesToExport(row: object): Promise<object> {
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
        row['id'],
        RegistrationStatusEnum[status],
      );
    }
    return row;
  }

  private async getAllProgramCustomAttributesForExport(
    programId: number,
  ): Promise<ProgramCustomAttributeEntity[]> {
    const program = await this.programRepository.findOne(programId, {
      relations: ['programCustomAttributes'],
    });
    return program.programCustomAttributes;
  }

  private async addPaymentFieldsToExport(
    row: object,
    payments: number[],
    transactions: any[],
  ): Promise<void> {
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
            t.referenceId === row['referenceId'] &&
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
            t.referenceId === row['referenceId'] &&
            !t.customData['IntersolvePayoutStatus'],
        );
      }
      row[`payment${payment}_status`] = creationTransaction?.status;
      row[`payment${payment}_amount`] = creationTransaction?.amount;
      row[`payment${payment}_date`] = creationTransaction?.paymentDate;
      row[`payment${payment}_voucherClaimed_date`] =
        transaction[IntersolvePayoutStatus.VoucherSent]?.status ===
        StatusEnum.success
          ? transaction[IntersolvePayoutStatus.VoucherSent]?.paymentDate
          : null;
    }
  }

  private async getRegistrationsGenericFields(
    programId: number,
    relationOptions: RegistrationDataOptions[],
    status?: RegistrationStatusEnum,
  ): Promise<object[]> {
    let query = this.registrationRepository
      .createQueryBuilder('registration')
      .leftJoin('registration.fsp', 'fsp')
      .select([
        `registration."id"`,
        `registration."registrationStatus" as status`,
        `registration."${GenericAttributes.phoneNumber}"`,
        `registration."${GenericAttributes.preferredLanguage}"`,
        `registration."${GenericAttributes.paymentAmountMultiplier}"`,
        `fsp.fsp as financialServiceProvider`,
        `registration."note"`,
        `registration."referenceId" as "referenceId"`,
      ])
      .andWhere({ programId: programId })
      .andWhere('registration."registrationStatus" != :registrationStatus', {
        registrationStatus: RegistrationStatusEnum.deleted,
      })
      .orderBy('"registration"."id"', 'ASC');
    if (status) {
      query = query.andWhere({ registrationStatus: status });
    }
    for (const r of relationOptions) {
      query.select(subQuery => {
        return this.registrationsService.customDataEntrySubQuery(
          subQuery,
          r.relation,
        );
      }, r.name);
    }
    return await query.getRawMany();
  }

  private async getRegistrationsFieldsForDuplicates(
    programId: number,
    relationOptions: RegistrationDataOptions[],
    registrationIds: number[],
  ): Promise<object[]> {
    let query = this.registrationRepository
      .createQueryBuilder('registration')
      .leftJoin('registration.fsp', 'fsp')
      .select([
        `registration."id"`,
        `registration."registrationStatus" AS status`,
        `fsp.fsp AS fsp`,
        `registration."${GenericAttributes.phoneNumber}"`,
      ])
      .andWhere({ programId: programId })
      .andWhere('registration.id IN (:...registrationIds)', {
        registrationIds: registrationIds,
      })
      .orderBy('"registration"."id"', 'ASC');
    for (const r of relationOptions) {
      query.select(subQuery => {
        return this.registrationsService.customDataEntrySubQuery(
          subQuery,
          r.relation,
        );
      }, r.name);
    }
    return await query.getRawMany();
  }

  private async replaceValueWithDropdownLabel(
    rows: object[],
    relationOptions: RegistrationDataOptions[],
  ): Promise<void> {
    // Creates mapping list of questions with a dropdown
    const valueOptionMappings = [];
    for (const option of relationOptions) {
      if (option.relation.programQuestionId) {
        const dropdownProgramQuestion = await this.programQuestionRepository.findOne(
          {
            where: {
              id: option.relation.programQuestionId,
              answerType: AnswerTypes.dropdown,
            },
          },
        );
        if (dropdownProgramQuestion) {
          valueOptionMappings.push({
            questionName: dropdownProgramQuestion.name,
            options: dropdownProgramQuestion.options,
          });
        }
      }
      if (option.relation.fspQuestionId) {
        const dropdownFspQuestion = await this.fspQuestionRepository.findOne({
          where: {
            id: option.relation.fspQuestionId,
            answerType: AnswerTypes.dropdown,
          },
        });
        if (dropdownFspQuestion) {
          valueOptionMappings.push({
            questionName: dropdownFspQuestion.name,
            options: dropdownFspQuestion.options,
          });
        }
      }
    }

    // Converts values of dropdown questions to the labels of the list of registrations
    for (const mapping of valueOptionMappings) {
      for (const r of rows) {
        const selectedOption = mapping.options.find(
          o => o.option === r[mapping.questionName],
        );
        if (selectedOption && selectedOption['label']['en']) {
          r[mapping.questionName] = selectedOption['label']['en'];
        }
      }
    }
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

  private async getNameRelationsByProgram(
    programId: number,
  ): Promise<RegistrationDataOptions[]> {
    const program = await this.programRepository.findOne({
      relations: ['programQuestions'],
      where: {
        id: programId,
      },
    });
    const relationOptions: RegistrationDataOptions[] = [];
    for (const programQuestion of program.programQuestions) {
      if (
        JSON.parse(JSON.stringify(program.fullnameNamingConvention)).includes(
          programQuestion.name,
        )
      ) {
        const relationOption = new RegistrationDataOptions();
        relationOption.name = programQuestion.name;
        relationOption.relation = { programQuestionId: programQuestion.id };
        relationOptions.push(relationOption);
      }
    }
    return relationOptions;
  }

  private async getDuplicates(
    programId: number,
  ): Promise<{
    fileName: ExportType;
    data: any[];
  }> {
    const duplicatesMap: Map<number, number[]> = new Map();
    const uniqueRegistrationIds: Set<number> = new Set();

    const programQuestions = await this.programQuestionRepository.find({
      where: {
        program: {
          id: programId,
        },
        duplicateCheck: true,
      },
    });
    const programQuestionIds = programQuestions.map(question => {
      return question.id;
    });
    const fspQuestions = await this.fspQuestionRepository.find({
      relations: ['fsp'],
      where: {
        duplicateCheck: true,
      },
    });
    const fspQuestionIds = fspQuestions.map(fspQuestion => {
      return fspQuestion.id;
    });
    const program = await this.programRepository.findOne(programId);
    const nameRelations = await this.getNameRelationsByProgram(programId);
    const duplicateRelationOptions = this.getRelationOptionsForDuplicates(
      programQuestions,
      fspQuestions,
    );
    const relationOptions = [...nameRelations, ...duplicateRelationOptions];

    let whereOptions = [];
    if (fspQuestionIds.length > 0) {
      whereOptions.push({ fspQuestionId: In(fspQuestionIds) });
    }
    if (programQuestionIds.length > 0) {
      whereOptions.push({ programQuestionId: In(programQuestionIds) });
    }
    const query = this.registrationDataRepository
      .createQueryBuilder('registration_data')
      .select(
        `array_agg(DISTINCT registration_data."registrationId") AS "duplicateRegistrationIds"`,
      )
      .innerJoin('registration_data.registration', 'registration')
      .where(whereOptions)
      .andWhere('registration.programId = :programId', { programId })
      .having('COUNT(registration_data.value) > 1')
      .andHaving('COUNT(DISTINCT "registrationId") > 1')
      .groupBy('registration_data.value');

    const duplicates = await query.getRawMany();

    if (!duplicates || duplicates.length === 0) {
      return {
        fileName: ExportType.duplicates,
        data: [],
      };
    }

    for (const duplicateEntry of duplicates) {
      const {
        duplicateRegistrationIds,
      }: { duplicateRegistrationIds: number[] } = duplicateEntry;
      for (const registrationId of duplicateRegistrationIds) {
        uniqueRegistrationIds.add(registrationId);
        const others = without(duplicateRegistrationIds, registrationId);
        if (duplicatesMap.has(registrationId)) {
          const duplicateMapEntry = duplicatesMap.get(registrationId);
          duplicatesMap.set(registrationId, duplicateMapEntry.concat(others));
        } else {
          duplicatesMap.set(registrationId, others);
        }
      }
    }

    const registrations = await this.getRegistrationsFieldsForDuplicates(
      programId,
      relationOptions,
      Array.from(uniqueRegistrationIds),
    );

    const result = registrations.map(registration => {
      registration = this.registrationsService.transformRegistrationByNamingConvention(
        JSON.parse(JSON.stringify(program.fullnameNamingConvention)),
        registration,
      );
      return {
        ...registration,
        duplicateWithIds: uniq(duplicatesMap.get(registration['id'])).join(','),
      };
    });

    return {
      fileName: ExportType.duplicates,
      data: result,
    };
  }

  private async getPaymentDetailsPayment(
    programId: number,
    minPaymentId: number,
    maxPaymentId: number,
    registrationDataOptions: RegistrationDataOptions[],
  ): Promise<any> {
    const latestTransactionPerPa = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('transaction.registrationId', 'registrationId')
      .addSelect('transaction.payment', 'payment')
      .addSelect('MAX(transaction.created)', 'maxCreated')
      .where('transaction.program.id = :programId', { programId: programId })
      .andWhere('transaction.payment between :minPaymentId and :maxPaymentId', {
        minPaymentId: minPaymentId,
        maxPaymentId: maxPaymentId,
      })
      .groupBy('transaction.registrationId')
      .addGroupBy('transaction.payment');

    const transactionQuery = this.transactionRepository
      .createQueryBuilder('transaction')
      .select([
        'transaction.payment as "payment"',
        'registration.phoneNumber as "phoneNumber"',
        'transaction.amount as "amount"',
        'transaction.status as "status"',
        'transaction."errorMessage" as "errorMessage"',
        'fsp.fsp AS financialServiceProvider',
      ])
      .innerJoin(
        '(' + latestTransactionPerPa.getQuery() + ')',
        'subquery',
        'transaction.registrationId = subquery."registrationId" AND transaction.payment = subquery.payment AND transaction.created = subquery."maxCreated"',
      )
      .setParameters(latestTransactionPerPa.getParameters())
      .leftJoin('transaction.registration', 'registration')
      .leftJoin('registration.fsp', 'fsp');

    for (const r of registrationDataOptions) {
      transactionQuery.select(subQuery => {
        return this.registrationsService.customDataEntrySubQuery(
          subQuery,
          r.relation,
        );
      }, r.name);
    }
    return await transactionQuery.getRawMany();
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
      true,
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
      [RegistrationStatusEnum.deleted]: await this.getTimestampsPerStatusAndTimePeriod(
        programId,
        registrations,
        RegistrationStatusEnum.deleted,
        payment,
        month,
        year,
        fromStart,
      ),
      [PaMetricsProperty.totalPaHelped]: await this.getTotalPaHelped(
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

  public async getTotalTransferAmounts(
    programId: number,
    referenceIdsDto: ReferenceIdsDto,
  ): Promise<TotalTransferAmounts> {
    let registrations;
    if (referenceIdsDto.referenceIds.length) {
      registrations = await this.registrationRepository.find({
        where: {
          referenceId: In(referenceIdsDto.referenceIds),
        },
        order: { id: 'ASC' },
      });
    } else {
      registrations = await this.registrationRepository.find({
        where: {
          program: { id: programId },
          registrationStatus: RegistrationStatusEnum.included,
        },
        relations: ['fsp'],
        order: { id: 'ASC' },
      });
    }
    const sum = registrations.reduce(function(a, b) {
      return a + (b[Attributes.paymentAmountMultiplier] || 1);
    }, 0);
    return {
      registrations: registrations.length,
      transferAmounts: sum,
    };
  }

  public async getProgramStats(programId: number): Promise<ProgramStats> {
    const targetedPeople = (await this.programRepository.findOne(programId))
      .highestScoresX;

    const registrations = await this.registrationRepository.find({
      where: {
        program: { id: programId },
        registrationStatus: RegistrationStatusEnum.included,
      },
    });

    const includedPeople = registrations.filter(
      r => r.registrationStatus === RegistrationStatusEnum.included,
    ).length;

    // Use this method to get only the latest attempt per PA per payment
    const transactionsQuery = this.transactionsService.getMaxAttemptPerPaAndPaymentTransactionsQuery(
      programId,
      false,
    );

    const { spentMoney } = await this.connection
      .createQueryBuilder()
      .select('SUM(amount)', 'spentMoney')
      .from('(' + transactionsQuery.getQuery() + ')', 'transactions')
      .setParameters(transactionsQuery.getParameters())
      .where('status = :status', { status: StatusEnum.success })
      .getRawOne();

    const totalBudget = 0; // TODO: we don't have this property yet in the program and it will be picked up in the future
    return {
      programId,
      targetedPeople,
      includedPeople,
      totalBudget,
      spentMoney,
    };
  }
}
