import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { uniq, without } from 'lodash';
import { PaginateQuery } from 'nestjs-paginate';
import { In, Not, Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { ActionService } from '../actions/action.service';
import { FspName } from '../fsp/enum/fsp-name.enum';
import { FspQuestionEntity } from '../fsp/fsp-question.entity';
import { IntersolveVisaExportService } from '../payments/fsp-integration/intersolve-visa/services/intersolve-visa-export.service';
import { IntersolveVoucherService } from '../payments/fsp-integration/intersolve-voucher/intersolve-voucher.service';
import { PaymentsService } from '../payments/payments.service';
import { TransactionEntity } from '../payments/transactions/transaction.entity';
import { ProgramCustomAttributeEntity } from '../programs/program-custom-attribute.entity';
import { ProgramQuestionEntity } from '../programs/program-question.entity';
import { ProgramEntity } from '../programs/program.entity';
import { PaginationFilter } from '../registration/dto/filter-attribute.dto';
import { RegistrationDataOptions } from '../registration/dto/registration-data-relation.model';
import {
  AnswerTypes,
  CustomDataAttributes,
  GenericAttributes,
} from '../registration/enum/custom-data-attributes';
import { RegistrationStatusEnum } from '../registration/enum/registration-status.enum';
import { RegistrationDataEntity } from '../registration/registration-data.entity';
import { RegistrationsService } from '../registration/registrations.service';
import { RegistrationScopedRepository } from '../registration/repositories/registration-scoped.repository';
import { RegistrationViewScopedRepository } from '../registration/repositories/registration-view-scoped.repository';
import { RegistrationsPaginationService } from '../registration/services/registrations-pagination.service';
import { ScopedRepository } from '../scoped.repository';
import { StatusEnum } from '../shared/enum/status.enum';
import { RegistrationDataScopedQueryService } from '../utils/registration-data-query/registration-data-query.service';
import { getScopedRepositoryProviderName } from '../utils/scope/createScopedRepositoryProvider.helper';
import { ExportType } from './dto/export-details.dto';
import { FileDto } from './dto/file.dto';
import { PaymentStateSumDto } from './dto/payment-state-sum.dto';
import { ProgramStats } from './dto/program-stats.dto';
import { RegistrationStatusStats } from './dto/registrationstatus-stats.dto';

@Injectable()
export class MetricsService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(ProgramQuestionEntity)
  private readonly programQuestionRepository: Repository<ProgramQuestionEntity>;
  @InjectRepository(ProgramCustomAttributeEntity)
  private readonly programCustomAttributeRepository: Repository<ProgramCustomAttributeEntity>;
  @InjectRepository(FspQuestionEntity)
  private readonly fspQuestionRepository: Repository<FspQuestionEntity>;

  public constructor(
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    private readonly registrationScopedViewRepository: RegistrationViewScopedRepository,
    @Inject(getScopedRepositoryProviderName(RegistrationDataEntity))
    private registrationDataScopedRepository: ScopedRepository<RegistrationDataEntity>,
    @Inject(getScopedRepositoryProviderName(TransactionEntity))
    private readonly transactionScopedRepository: ScopedRepository<TransactionEntity>,
    private readonly actionService: ActionService,
    private readonly paymentsService: PaymentsService,
    private readonly registrationsService: RegistrationsService,
    private readonly registrationsPaginationsService: RegistrationsPaginationService,
    private readonly registrationDataQueryService: RegistrationDataScopedQueryService,
    private readonly intersolveVisaExportService: IntersolveVisaExportService,
    private readonly intersolveVoucherService: IntersolveVoucherService,
  ) {}

  public async getExportList(
    programId: number,
    type: ExportType,
    userId: number,
    minPayment: number | null = null,
    maxPayment: number | null = null,
    paginationQuery?: PaginateQuery,
  ): Promise<FileDto> {
    await this.actionService.saveAction(userId, programId, type);
    switch (type) {
      case ExportType.allPeopleAffected: {
        return this.getAllPeopleAffectedList(
          programId,
          paginationQuery.filter,
          paginationQuery.search,
        );
      }
      case ExportType.included: {
        return this.getInclusionList(programId);
      }
      case ExportType.payment: {
        return this.getPaymentDetails(programId, minPayment, maxPayment);
      }
      case ExportType.unusedVouchers: {
        return this.getUnusedVouchers(programId);
      }
      case ExportType.vouchersWithBalance: {
        return this.getVouchersWithBalance(programId);
      }
      case ExportType.duplicates: {
        return this.getDuplicates(programId);
      }
      case ExportType.cardBalances: {
        return this.getCardBalances(programId);
      }
    }
  }

  private async getAllPeopleAffectedList(
    programId: number,
    filter: PaginationFilter,
    search?: string,
  ): Promise<FileDto> {
    const data = await this.getRegistrationsList(
      programId,
      ExportType.allPeopleAffected,
      null,
      filter,
      search,
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
    );
    const response = {
      fileName: 'inclusion-list',
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
    const pastPaymentDetails = await this.getPaymentDetailsPayment(
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
    filter?: PaginationFilter,
    search?: string,
  ): Promise<object[]> {
    if (registrationStatus) {
      filter = { status: registrationStatus };
    }
    const relationOptions = await this.getRelationOptionsForExport(
      programId,
      exportType,
    );
    const rows = await this.getRegistrationsGenericFields(
      programId,
      relationOptions,
      exportType,
      filter,
      search,
    );

    for await (const row of rows) {
      row['id'] = row['registrationProgramId'];

      const preferredLanguage = row['preferredLanguage'] || 'en';
      row['fspDisplayName'] = row['fspDisplayName'][preferredLanguage];

      delete row['registrationProgramId'];
    }
    await this.replaceValueWithDropdownLabel(rows, relationOptions);

    const orderedObjects = [];
    for await (const row of rows) {
      // An object which will serve as the order template
      const objectOrder = {
        referenceId: null,
        id: null,
        status: null,
        phoneNumber: null,
        preferredLanguage: null,
        financialserviceprovider: null,
        paymentAmountMultiplier: null,
      };
      const addObjectResource = Object.assign(objectOrder, row);
      orderedObjects.push(addObjectResource);
    }
    return this.filterUnusedColumn(orderedObjects);
  }

  private async getRelationOptionsForExport(
    programId: number,
    exportType: ExportType,
  ): Promise<RegistrationDataOptions[]> {
    const relationOptions = [];
    const program = await this.programRepository.findOne({
      where: { id: programId },
      relations: [
        'programQuestions',
        'programCustomAttributes',
        'financialServiceProviders',
        'financialServiceProviders.questions',
      ],
    });
    for (const programCustomAttr of program.programCustomAttributes) {
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
        relationOption.relation = {
          programQuestionId: programQuestion.id,
        };
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
    programCustomAttributes: ProgramCustomAttributeEntity[],
    fspQuestions: FspQuestionEntity[],
  ): RegistrationDataOptions[] {
    const relationOptions = [];
    for (const programQuestion of programQuestions) {
      const relationOption = new RegistrationDataOptions();
      relationOption.name = programQuestion.name;
      relationOption.relation = { programQuestionId: programQuestion.id };
      relationOptions.push(relationOption);
    }

    for (const programCustomAttribute of programCustomAttributes) {
      const relationOption = new RegistrationDataOptions();
      relationOption.name = programCustomAttribute.name;
      relationOption.relation = {
        programCustomAttributeId: programCustomAttribute.id,
      };
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

  private async getUnusedVouchers(programId?: number): Promise<FileDto> {
    const unusedVouchers =
      await this.intersolveVoucherService.getUnusedVouchers(programId);
    for (const v of unusedVouchers) {
      delete v.referenceId;
    }

    const response = {
      fileName: ExportType.unusedVouchers,
      data: unusedVouchers,
    };

    return response;
  }

  private async getVouchersWithBalance(programId: number): Promise<FileDto> {
    const vouchersWithBalance =
      await this.intersolveVoucherService.getVouchersWithBalance(programId);
    const response = {
      fileName: ExportType.vouchersWithBalance,
      data: vouchersWithBalance,
    };
    return response;
  }

  public async getToCancelVouchers(): Promise<FileDto> {
    const toCancelVouchers =
      await this.intersolveVoucherService.getToCancelVouchers();

    const response = {
      fileName: ExportType.toCancelVouchers,
      data: toCancelVouchers,
    };

    return response;
  }

  private async getRegistrationsGenericFields(
    programId: number,
    relationOptions: RegistrationDataOptions[],
    exportType?: ExportType,
    filter?: PaginationFilter,
    search?: string,
  ): Promise<object[]> {
    // Create an empty scoped querybuilder object
    let queryBuilder = this.registrationScopedViewRepository
      .createQueryBuilder('registration')
      .andWhere({ programId: programId });

    if (exportType !== ExportType.allPeopleAffected && !filter?.['status']) {
      queryBuilder = queryBuilder.andWhere(
        'registration."status" != :registrationStatus',
        {
          registrationStatus: RegistrationStatusEnum.deleted,
        },
      );
    }

    const defaultSelect = [
      GenericAttributes.referenceId,
      GenericAttributes.registrationProgramId,
      GenericAttributes.status,
      GenericAttributes.phoneNumber,
      GenericAttributes.preferredLanguage,
      GenericAttributes.paymentAmountMultiplier,
      GenericAttributes.registrationCreatedDate,
      GenericAttributes.fspDisplayName,
    ] as string[];

    const program = await this.programRepository.findOneBy({
      id: programId,
    });

    if (program.enableMaxPayments) {
      defaultSelect.push(GenericAttributes.maxPayments);
    }

    if (program.enableScope) {
      defaultSelect.push(GenericAttributes.scope);
    }

    const registrationDataNamesProgram = relationOptions
      .map((r) => r.name)
      .filter((r) => r !== CustomDataAttributes.phoneNumber);

    const chunkSize = 10000;
    const paginateQuery = {
      path: 'registration',
      filter: filter,
      limit: chunkSize,
      page: 1,
      select: defaultSelect.concat(registrationDataNamesProgram),
      search: search,
    };

    const data =
      await this.registrationsPaginationsService.getRegistrationsChunked(
        programId,
        paginateQuery,
        chunkSize,
        queryBuilder,
      );
    return data;
  }

  private async getRegistrationsFieldsForDuplicates(
    programId: number,
    relationOptions: RegistrationDataOptions[],
    registrationIds: number[],
  ): Promise<object[]> {
    const query = this.registrationScopedRepository
      .createQueryBuilder('registration')
      .leftJoin('registration.fsp', 'fsp')
      .select([
        `registration."registrationProgramId" AS "id"`,
        `registration."registrationStatus" AS status`,
        `fsp."displayName" AS fsp`,
        `registration."${GenericAttributes.phoneNumber}"`,
      ])
      .andWhere({ programId: programId })
      .andWhere(
        'registration."registrationProgramId" IN (:...registrationIds)',
        {
          registrationIds: registrationIds,
        },
      )
      .orderBy('"registration"."registrationProgramId"', 'ASC');
    for (const r of relationOptions) {
      query.select((subQuery) => {
        return this.registrationDataQueryService.customDataEntrySubQuery(
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
        const dropdownProgramQuestion =
          await this.programQuestionRepository.findOne({
            where: {
              id: option.relation.programQuestionId,
              answerType: AnswerTypes.dropdown,
            },
          });
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
          (o) => o.option === r[mapping.questionName],
        );
        if (selectedOption && selectedOption['label']['en']) {
          r[mapping.questionName] = selectedOption['label']['en'];
        }
      }
    }
  }

  private filterUnusedColumn(columnDetails): object[] {
    const filteredColumns = [];
    for (const row of columnDetails) {
      const filteredRow = {};
      for (const key in row) {
        if (row[key]) {
          filteredRow[key] = row[key];
        }
      }
      filteredColumns.push(filteredRow);
    }
    return filteredColumns;
  }

  private async getNameRelationsByProgram(
    programId: number,
  ): Promise<RegistrationDataOptions[]> {
    const program = await this.programRepository.findOne({
      relations: ['programQuestions', 'programCustomAttributes'],
      where: {
        id: programId,
      },
    });
    const relationOptions: RegistrationDataOptions[] = [];
    const combinedArray = [
      ...program.programQuestions,
      ...program.programCustomAttributes,
    ];
    for (const entry of combinedArray) {
      if (
        JSON.parse(JSON.stringify(program.fullnameNamingConvention)).includes(
          entry.name,
        )
      ) {
        const relationOption = new RegistrationDataOptions();
        relationOption.name = entry.name;
        if (entry instanceof ProgramCustomAttributeEntity) {
          relationOption.relation = {
            programCustomAttributeId: entry.id,
          };
        }
        if (entry instanceof ProgramQuestionEntity) {
          relationOption.relation = {
            programQuestionId: entry.id,
          };
        }
        relationOptions.push(relationOption);
      }
    }
    return relationOptions;
  }

  private async getDuplicates(programId: number): Promise<{
    fileName: ExportType;
    data: any[];
  }> {
    const duplicatesMap = new Map<number, number[]>();
    const uniqueRegistrationIds = new Set<number>();

    const programQuestions = await this.programQuestionRepository.find({
      where: {
        program: {
          id: programId,
        },
        duplicateCheck: true,
      },
    });
    const programQuestionIds = programQuestions.map((question) => {
      return question.id;
    });
    const programCustomAttributes =
      await this.programCustomAttributeRepository.find({
        where: {
          program: {
            id: programId,
          },
          duplicateCheck: true,
        },
      });
    const programCustomAttributeIds = programCustomAttributes.map((att) => {
      return att.id;
    });
    const fspQuestions = await this.fspQuestionRepository.find({
      relations: ['fsp', 'fsp.program'],
      where: {
        duplicateCheck: true,
        fsp: { program: { id: programId } },
      },
    });

    const fspQuestionIds = fspQuestions.map((fspQuestion) => {
      return fspQuestion.id;
    });

    const program = await this.programRepository.findOne({
      where: { id: programId },
      relations: ['financialServiceProviders'],
    });
    const nameRelations = await this.getNameRelationsByProgram(programId);
    const duplicateRelationOptions = this.getRelationOptionsForDuplicates(
      programQuestions,
      programCustomAttributes,
      fspQuestions,
    );
    const relationOptions = [...nameRelations, ...duplicateRelationOptions];

    const whereOptions = [];
    if (programQuestionIds.length > 0) {
      whereOptions.push({ programQuestionId: In(programQuestionIds) });
    }
    if (programCustomAttributeIds.length > 0) {
      whereOptions.push({
        programCustomAttributeId: In(programCustomAttributeIds),
      });
    }
    if (fspQuestionIds.length > 0) {
      whereOptions.push({ fspQuestionId: In(fspQuestionIds) });
    }

    const query = this.registrationDataScopedRepository
      .createQueryBuilder('registration_data')
      .select(
        `array_agg(DISTINCT registration_data."registrationId") AS "duplicateRegistrationIds"`,
      )
      .addSelect(
        `array_agg(DISTINCT registration."registrationProgramId") AS "duplicateRegistrationProgramIds"`,
      )
      .innerJoin('registration_data.registration', 'registration')
      .andWhere(whereOptions)
      .andWhere('registration.programId = :programId', { programId })
      .andWhere('registration."registrationStatus" != :status', {
        status: RegistrationStatusEnum.rejected,
      })
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
        duplicateRegistrationProgramIds,
      }: {
        duplicateRegistrationIds: number[];
        duplicateRegistrationProgramIds: number[];
      } = duplicateEntry;
      for (const registrationId of duplicateRegistrationProgramIds) {
        uniqueRegistrationIds.add(registrationId);
        const others = without(duplicateRegistrationProgramIds, registrationId);
        if (duplicatesMap.has(registrationId)) {
          const duplicateMapEntry = duplicatesMap.get(registrationId);
          duplicatesMap.set(registrationId, duplicateMapEntry.concat(others));
        } else {
          duplicatesMap.set(registrationId, others);
        }
      }
    }
    // TODO: refactor this to use the paginate functionality
    return this.getRegisrationsForDuplicates(
      duplicatesMap,
      uniqueRegistrationIds,
      fspQuestions,
      relationOptions,
      program,
    );
  }

  private async getRegisrationsForDuplicates(
    duplicatesMap: Map<number, number[]>,
    uniqueRegistrationProgramIds: Set<number>,
    fspQuestions: FspQuestionEntity[],
    relationOptions: RegistrationDataOptions[],
    program: ProgramEntity,
  ): Promise<{
    fileName: ExportType;
    data: any[];
  }> {
    const registrationAndFspId = await this.registrationScopedRepository.find({
      where: {
        registrationProgramId: In([
          ...Array.from(uniqueRegistrationProgramIds),
        ]),
        programId: program.id,
      },
      select: ['registrationProgramId', 'fspId'],
    });

    // Create an object to group registrations by fspId
    const groupedRegistrations: Record<
      string,
      { registrationProgramId: number; fspId: number }[]
    > = {};
    registrationAndFspId.forEach((registration) => {
      const { registrationProgramId, fspId } = registration;
      if (!groupedRegistrations[fspId]) {
        groupedRegistrations[fspId] = [];
      }
      groupedRegistrations[fspId].push({ registrationProgramId, fspId });
    });

    // Create an object to group relation options per FSP
    const relationOptionsPerFsp = this.getRelationOptionsPerFsp(
      relationOptions,
      program,
      fspQuestions,
    );

    const relationOptionNoFsp = relationOptions.filter(
      (o) => !o.relation.fspQuestionId,
    );

    let allRegistrations = [];
    for (const [fspId, registrationIds] of Object.entries(
      groupedRegistrations,
    )) {
      const registrationsWithSameFspId =
        await this.getRegistrationsFieldsForDuplicates(
          program.id,
          relationOptionsPerFsp[fspId]
            ? relationOptionsPerFsp[fspId]
            : relationOptionNoFsp,
          registrationIds.map((r) => r.registrationProgramId),
        );
      allRegistrations = allRegistrations.concat(registrationsWithSameFspId);
    }
    const result = allRegistrations.map((registration) => {
      registration =
        this.registrationsService.transformRegistrationByNamingConvention(
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

  private getRelationOptionsPerFsp(
    relationOptions: RegistrationDataOptions[],
    program: ProgramEntity,
    fspQuestions: FspQuestionEntity[],
  ): Record<number, RegistrationDataOptions[]> {
    const relationOptionsPerFsp = {};
    for (const fsp of program.financialServiceProviders) {
      // Get all non fsp questions
      relationOptionsPerFsp[fsp.id] = relationOptions.filter(
        (o) => !o.relation.fspQuestionId,
      );
      // Get all questions for specific fsp
      const fspQuestionsPerFsp = fspQuestions.filter(
        (question) => question.fsp.id === fsp.id,
      );
      for (const question of fspQuestionsPerFsp) {
        const fspQuestionRelation = relationOptions.find(
          (o) => o.relation.fspQuestionId === question.id,
        );
        relationOptionsPerFsp[fsp.id].push(fspQuestionRelation);
      }
    }
    return relationOptionsPerFsp;
  }

  private async getPaymentDetailsPayment(
    programId: number,
    minPaymentId: number,
    maxPaymentId: number,
    registrationDataOptions: RegistrationDataOptions[],
  ): Promise<any> {
    const latestTransactionPerPa = await this.transactionScopedRepository
      .createQueryBuilder('transaction')
      .select('transaction.registrationId', 'registrationId')
      .addSelect('transaction.payment', 'payment')
      .addSelect('MAX(transaction.created)', 'maxCreated')
      .andWhere('transaction.program.id = :programId', {
        programId: programId,
      })
      .andWhere('transaction.payment between :minPaymentId and :maxPaymentId', {
        minPaymentId: minPaymentId,
        maxPaymentId: maxPaymentId,
      })
      .groupBy('transaction.registrationId')
      .addGroupBy('transaction.payment');

    // The SUBSTRING() in the query below is to prevent an error within the XLSX library when the string is too long (32767 characters)
    const transactionQuery = this.transactionScopedRepository
      .createQueryBuilder('transaction')
      .select([
        'registration.referenceId as "referenceId"',
        'transaction.status as "status"',
        'transaction.payment as "payment"',
        'transaction.created as "timestamp"',
        'registration.phoneNumber as "phoneNumber"',
        'registration.paymentAmountMultiplier as "paymentAmountMultiplier"',
        'transaction.amount as "amount"',
        'SUBSTRING(transaction."errorMessage", 1, 32000) as "errorMessage"',
        'fsp.fsp AS financialServiceProvider',
      ])
      .innerJoin(
        '(' + latestTransactionPerPa.getQuery() + ')',
        'subquery',
        'transaction.registrationId = subquery."registrationId" AND transaction.payment = subquery.payment AND transaction.created = subquery."maxCreated"',
      )
      .setParameters(latestTransactionPerPa.getParameters())
      .leftJoin('transaction.registration', 'registration')
      .leftJoin('transaction.financialServiceProvider', 'fsp');

    const additionalFspExportFields =
      await this.getAdditionalFspExportFields(programId);

    for (const field of additionalFspExportFields) {
      const nestedParts = field.split('.');
      let variabeleSelectQuery = 'transaction."customData"';
      for (const part of nestedParts) {
        variabeleSelectQuery += `->'${part}'`;
      }
      transactionQuery.addSelect(
        variabeleSelectQuery,
        nestedParts[nestedParts.length - 1],
      );
    }

    const duplicateNames = registrationDataOptions
      .map((r) => r.name)
      .filter((value, index, self) => self.indexOf(value) !== index);

    const generatedUniqueIds = [];
    for (const r of registrationDataOptions) {
      let name = r.name;
      if (duplicateNames.includes(r.name)) {
        const uniqueSelectQueryId = uuid().replace(/-/g, '').toLowerCase();
        name = `${uniqueSelectQueryId}_${r.name}`;
        generatedUniqueIds.push({ originalName: r.name, newUniqueName: name });
      }
      transactionQuery.select((subQuery) => {
        return this.registrationDataQueryService.customDataEntrySubQuery(
          subQuery,
          r.relation,
        );
      }, name);
    }
    const rawResult = await transactionQuery.getRawMany();
    return this.mapFspAttributesToOriginalName(rawResult, generatedUniqueIds);
  }

  private mapFspAttributesToOriginalName(
    rows: any[],
    generatedUniqueIdObjects: { newUniqueName: string; originalName: string }[],
  ): any[] {
    const generatedUniqueIds = generatedUniqueIdObjects.map(
      (o) => o.newUniqueName,
    );
    const result = [];
    for (const row of rows) {
      const resultRow = {};
      for (const [key, value] of Object.entries(row)) {
        if (generatedUniqueIds.includes(key)) {
          const name = generatedUniqueIdObjects.find(
            (o) => o.newUniqueName === key,
          ).originalName;
          if (value !== null) {
            resultRow[name] = value;
          }
        } else {
          resultRow[key] = value;
        }
      }
      result.push(resultRow);
    }
    return result;
  }

  private async getAdditionalFspExportFields(
    programId: number,
  ): Promise<string[]> {
    const program = await this.programRepository.findOne({
      where: { id: programId },
      relations: ['financialServiceProviders'],
    });
    let fields = [];
    for (const fsp of program.financialServiceProviders) {
      if (fsp.fsp === FspName.safaricom) {
        fields = [...fields, ...['requestResult.OriginatorConversationID']];
      }
    }
    return fields;
  }

  public async getPaymentsWithStateSums(
    programId: number,
  ): Promise<PaymentStateSumDto[]> {
    const totalProcessedPayments = await this.transactionScopedRepository
      .createQueryBuilder('transaction')
      .select('MAX(transaction.payment)')
      .andWhere('transaction."programId" = :programId', {
        programId: programId,
      })
      .getRawOne();
    const program = await this.programRepository.findOneBy({
      id: programId,
    });
    const paymentNrSearch = Math.max(
      ...[totalProcessedPayments.max, program.distributionDuration],
    );
    const paymentsWithStats = [];
    let i = 1;
    const transactionStepMin = await await this.transactionScopedRepository
      .createQueryBuilder('transaction')
      .select('MIN(transaction.transactionStep)')
      .andWhere('transaction."programId" = :programId', {
        programId: programId,
      })
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
    const currentPaymentRegistrationsAndCount =
      await this.transactionScopedRepository.findAndCount({
        where: {
          program: { id: programId },
          status: StatusEnum.success,
          payment: payment,
          transactionStep: transactionStepOfInterest,
        },
        relations: ['registration'],
      });
    const currentPaymentRegistrations = currentPaymentRegistrationsAndCount[0];
    const currentPaymentCount = currentPaymentRegistrationsAndCount[1];
    const currentPaymentRegistrationsIds = currentPaymentRegistrations.map(
      ({ registration }) => registration.id,
    );
    let preExistingPa: number;
    if (currentPaymentCount > 0) {
      preExistingPa = await this.transactionScopedRepository
        .createQueryBuilder('transaction')
        .leftJoin('transaction.registration', 'registration')
        .andWhere('transaction.registration.id IN (:...registrationIds)', {
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

  public async getProgramStats(programId: number): Promise<ProgramStats> {
    const targetedPeople = (
      await this.programRepository.findOneBy({
        id: programId,
      })
    ).targetNrRegistrations;

    const includedPeople = await this.registrationScopedRepository.count({
      where: {
        program: { id: programId },
        registrationStatus: RegistrationStatusEnum.included,
      },
    });

    const result = await this.transactionScopedRepository
      .createQueryBuilder('transaction')
      .select('SUM(transaction.amount)', 'spentMoney')
      .innerJoin('transaction.latestTransaction', 'lt')
      .andWhere('transaction."programId" = :programId', {
        programId: programId,
      })
      .getRawOne();
    const spentMoney = result.spentMoney;

    const totalBudget = (
      await this.programRepository.findOneBy({
        id: programId,
      })
    ).budget;

    return {
      programId,
      targetedPeople,
      includedPeople,
      totalBudget,
      spentMoney,
    };
  }

  private async getCardBalances(programId: number): Promise<{
    fileName: ExportType;
    data: any[];
  }> {
    const data = await this.intersolveVisaExportService.getCards(programId);
    return {
      fileName: ExportType.cardBalances,
      data,
    };
  }

  public async getRegistrationStatusStats(
    programId: number,
  ): Promise<RegistrationStatusStats[]> {
    const query = this.registrationScopedRepository
      .createQueryBuilder('registration')
      .select(`registration."registrationStatus" AS status`)
      .addSelect(`COUNT(registration."registrationStatus") AS "statusCount"`)
      .andWhere({ programId: programId })
      .andWhere({ registrationStatus: Not(RegistrationStatusEnum.deleted) })
      .groupBy(`registration."registrationStatus"`);
    const res = await query.getRawMany<RegistrationStatusStats>();
    return res;
  }
}
