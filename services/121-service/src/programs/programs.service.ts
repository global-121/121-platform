import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FilterOperator } from 'nestjs-paginate';
import { DataSource, In, QueryFailedError, Repository } from 'typeorm';
import { ActionEntity } from '../actions/action.entity';
import { FspName } from '../fsp/enum/fsp-name.enum';
import { FinancialServiceProviderEntity } from '../fsp/financial-service-provider.entity';
import { FspQuestionEntity } from '../fsp/fsp-question.entity';
import { ExportType } from '../metrics/dto/export-details.dto';
import { TransactionEntity } from '../payments/transactions/transaction.entity';
import {
  AllowedFilterOperatorsNumber,
  AllowedFilterOperatorsString,
  PaginateConfigRegistrationViewWithPayments,
} from '../registration/const/filter-operation.const';
import { FilterAttributeDto } from '../registration/dto/filter-attribute.dto';
import { RegistrationDataInfo } from '../registration/dto/registration-data-relation.model';
import {
  Attribute,
  QuestionType,
} from '../registration/enum/custom-data-attributes';
import { nameConstraintQuestionsArray } from '../shared/const';
import { ProgramPhase } from '../shared/enum/program-phase.model';
import { PermissionEnum } from '../user/permission.enum';
import { DefaultUserRole } from '../user/user-role.enum';
import { UserEntity } from '../user/user.entity';
import { UserService } from '../user/user.service';
import {
  CreateProgramCustomAttributeDto,
  UpdateProgramCustomAttributeDto,
} from './dto/create-program-custom-attribute.dto';
import { CreateProgramDto } from './dto/create-program.dto';
import {
  CreateProgramQuestionDto,
  UpdateProgramQuestionDto,
} from './dto/program-question.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { ProgramCustomAttributeEntity } from './program-custom-attribute.entity';
import { ProgramQuestionEntity } from './program-question.entity';
import { ProgramEntity } from './program.entity';
import { ProgramsRO, SimpleProgramRO } from './program.interface';
@Injectable()
export class ProgramService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(ProgramQuestionEntity)
  public programQuestionRepository: Repository<ProgramQuestionEntity>;
  @InjectRepository(ProgramCustomAttributeEntity)
  public programCustomAttributeRepository: Repository<ProgramCustomAttributeEntity>;
  @InjectRepository(FspQuestionEntity)
  public fspAttributeRepository: Repository<FspQuestionEntity>;
  @InjectRepository(FinancialServiceProviderEntity)
  public financialServiceProviderRepository: Repository<FinancialServiceProviderEntity>;
  @InjectRepository(TransactionEntity)
  public transactionRepository: Repository<TransactionEntity>;
  @InjectRepository(ActionEntity)
  public actionRepository: Repository<ActionEntity>;
  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>;

  public constructor(
    private readonly dataSource: DataSource,
    private readonly userService: UserService,
  ) {}

  public async findOne(
    programId: number,
    userId?: number,
  ): Promise<ProgramEntity> {
    let includeMetricsUrl = false;
    if (userId) {
      includeMetricsUrl = await this.userService.canActivate(
        [PermissionEnum.ProgramMetricsREAD],
        programId,
        userId,
      );
    }

    const relations = [
      'programQuestions',
      'financialServiceProviders',
      'financialServiceProviders.questions',
      'programCustomAttributes',
    ];

    const program = await this.programRepository.findOne({
      where: { id: programId },
      relations: relations,
    });
    if (program) {
      program.editableAttributes = await this.getPaEditableAttributes(
        program.id,
      );
      program['paTableAttributes'] = await this.getPaTableAttributes(
        program.id,
      );

      // TODO: Get these attributes from some enum or something
      program['filterableAttributes'] = this.getFilterableAttributes(program);

      if (!includeMetricsUrl) {
        delete program.monitoringDashboardUrl;
        delete program.evaluationDashboardUrl;
      }
    }
    // TODO: REFACTOR: use DTO to define (stable) structure of data to return (not sure if transformation should be done here or in controller)
    return program;
  }

  public getFilterableAttributes(
    program: ProgramEntity,
  ): { group: string; filters: FilterAttributeDto[] }[] {
    const genericPaAttributeFilters = [
      'personAffectedSequence',
      'referenceId',
      'registrationCreatedDate',
      'phoneNumber',
      'preferredLanguage',
      'inclusionScore',
      'paymentAmountMultiplier',
      'fspDisplayNamePortal',
    ];
    const paAttributesNameArray = program['paTableAttributes'].map(
      (paAttribute: Attribute) => paAttribute.name,
    );

    let filterableAttributeNames = [
      {
        group: 'payments',
        filters: ['failedPayment', 'waitingPayment', 'successPayment'],
      },
      {
        group: 'messages',
        filters: ['lastMessageStatus'],
      },
      {
        group: 'paAttributes',
        filters: [
          ...new Set([...genericPaAttributeFilters, ...paAttributesNameArray]),
        ],
      },
    ];
    if (program.enableMaxPayments) {
      filterableAttributeNames = [
        ...filterableAttributeNames,
        ...[
          {
            group: 'maxPayments',
            filters: ['maxPayments', 'paymentCount', 'paymentCountRemaining'],
          },
        ],
      ];
    }

    const filterableAttributes = [];
    for (const group of filterableAttributeNames) {
      const filterableAttributesPerGroup: FilterAttributeDto[] = [];
      for (const name of group.filters) {
        if (
          PaginateConfigRegistrationViewWithPayments.filterableColumns[name]
        ) {
          filterableAttributesPerGroup.push({
            name: name,
            allowedOperators: PaginateConfigRegistrationViewWithPayments
              .filterableColumns[name] as FilterOperator[],
            isInteger:
              PaginateConfigRegistrationViewWithPayments.filterableColumns[
                name
              ] === AllowedFilterOperatorsNumber,
          });
        } else {
          // If no allowed operators are defined than the attribute is
          // registration data which is stored as a string
          filterableAttributesPerGroup.push({
            name: name,
            allowedOperators: AllowedFilterOperatorsString,
            isInteger: false,
          });
        }
      }
      filterableAttributes.push({
        group: group.group,
        filters: filterableAttributesPerGroup,
      });
    }

    return filterableAttributes;
  }

  public async getCreateProgramDto(
    programId: number,
    userId: number,
  ): Promise<CreateProgramDto> {
    const programEntity = await this.findOne(programId, userId);
    if (!programEntity) {
      const errors = `No program found with id ${programId}`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    const programDto: CreateProgramDto = {
      published: programEntity.published,
      validation: programEntity.validation,
      phase: programEntity.phase,
      location: programEntity.location,
      ngo: programEntity.ngo,
      titlePortal: programEntity.titlePortal,
      titlePaApp: programEntity.titlePaApp,
      description: programEntity.description,
      startDate: programEntity.startDate,
      endDate: programEntity.endDate,
      currency: programEntity.currency,
      distributionFrequency: programEntity.distributionFrequency,
      distributionDuration: programEntity.distributionDuration,
      fixedTransferValue: programEntity.fixedTransferValue,
      paymentAmountMultiplierFormula:
        programEntity.paymentAmountMultiplierFormula,
      financialServiceProviders: programEntity.financialServiceProviders.map(
        (fsp) => {
          return {
            fsp: fsp.fsp as FspName,
          };
        },
      ),
      targetNrRegistrations: programEntity.targetNrRegistrations,
      tryWhatsAppFirst: programEntity.tryWhatsAppFirst,
      meetingDocuments: programEntity.meetingDocuments,
      notifications: programEntity.notifications,
      phoneNumberPlaceholder: programEntity.phoneNumberPlaceholder,
      programCustomAttributes: programEntity.programCustomAttributes.map(
        (programCustomAttribute) => {
          return {
            name: programCustomAttribute.name,
            type: programCustomAttribute.type,
            label: programCustomAttribute.label,
            phases: programCustomAttribute.phases,
            duplicateCheck: programCustomAttribute.duplicateCheck,
          };
        },
      ),
      programQuestions: programEntity.programQuestions.map(
        (programQuestion) => {
          return {
            name: programQuestion.name,
            label: programQuestion.label,
            answerType: programQuestion.answerType,
            questionType: programQuestion.questionType,
            options: programQuestion.options,
            scoring: programQuestion.scoring,
            persistence: programQuestion.persistence,
            pattern: programQuestion.pattern,
            phases: programQuestion.phases,
            editableInPortal: programQuestion.editableInPortal,
            export: programQuestion.export as unknown as ExportType[],
            shortLabel: programQuestion.shortLabel,
            duplicateCheck: programQuestion.duplicateCheck,
            placeholder: programQuestion.placeholder,
          };
        },
      ),
      aboutProgram: programEntity.aboutProgram,
      fullnameNamingConvention: programEntity.fullnameNamingConvention,
      languages: programEntity.languages,
      enableMaxPayments: programEntity.enableMaxPayments,
    };
    if (programEntity.monitoringDashboardUrl) {
      programDto.monitoringDashboardUrl = programEntity.monitoringDashboardUrl;
    }
    if (programEntity.evaluationDashboardUrl) {
      programDto.evaluationDashboardUrl = programEntity.evaluationDashboardUrl;
    }
    return programDto;
  }

  public async getPublishedPrograms(): Promise<ProgramsRO> {
    const programs = await this.programRepository
      .createQueryBuilder('program')
      .leftJoinAndSelect('program.programQuestions', 'programQuestion')
      .where('program.published = :published', { published: true })
      .orderBy('program.created', 'DESC')
      .addOrderBy('programQuestion.id', 'ASC')
      .getMany();
    const programsCount = programs.length;
    return { programs, programsCount };
  }

  // TODO: REFACTOR: the Controller should throw the HTTP Status Code
  public async findUserProgramAssignmentsOrThrow(
    userId: number,
  ): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: [
        'programAssignments',
        'programAssignments.program',
        'programAssignments.roles',
        'programAssignments.roles.permissions',
      ],
    });
    if (
      !user ||
      !user.programAssignments ||
      user.programAssignments.length === 0
    ) {
      const errors = 'User not found or no assigned programs';
      throw new HttpException({ errors }, HttpStatus.UNAUTHORIZED);
    }
    return user;
  }

  public async getAssignedPrograms(userId: number): Promise<ProgramsRO> {
    const user = await this.findUserProgramAssignmentsOrThrow(userId);
    const programIds = user.programAssignments.map((p) => p.program.id);
    const programs = await this.programRepository.find({
      where: { id: In(programIds) },
      relations: [
        'programQuestions',
        'programCustomAttributes',
        'financialServiceProviders',
        'financialServiceProviders.questions',
      ],
    });
    const programsCount = programs.length;

    return { programs, programsCount };
  }

  private async validateProgram(programData: CreateProgramDto): Promise<void> {
    const fspAttributeNames = [];
    for (const fsp of programData.financialServiceProviders) {
      const fspEntity = await this.financialServiceProviderRepository.findOne({
        where: { fsp: fsp.fsp },
        relations: ['questions'],
      });
      for (const question of fspEntity.questions) {
        fspAttributeNames.push(question.name);
      }
    }
    const programQuestionNames = programData.programQuestions.map(
      (q) => q.name,
    );
    const customAttributeNames = programData.programCustomAttributes.map(
      (ca) => ca.name,
    );
    const allAttributeNames = programQuestionNames.concat(
      customAttributeNames,
      [...new Set(fspAttributeNames)],
    );
    for (const name of Object.values(programData.fullnameNamingConvention)) {
      if (!allAttributeNames.includes(name)) {
        const errors = `Element '${name}' of fullnameNamingConvention is not found in program questions or custom attributes`;
        throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
      }
    }
    // Check if allAttributeNames has duplicate values
    const duplicateNames = allAttributeNames.filter(
      (item, index) => allAttributeNames.indexOf(item) !== index,
    );
    if (duplicateNames.length > 0) {
      const errors = `The names ${duplicateNames.join(
        ', ',
      )} are used more than once program question, custom attribute or fsp attribute`;
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }
  }

  public async create(
    programData: CreateProgramDto,
    userId: number,
  ): Promise<ProgramEntity> {
    let newProgram;

    await this.validateProgram(programData);
    const program = new ProgramEntity();
    program.published = programData.published;
    program.validation = programData.validation;
    program.phase = programData.phase;
    program.location = programData.location;
    program.ngo = programData.ngo;
    program.titlePortal = programData.titlePortal;
    program.titlePaApp = programData.titlePaApp;
    program.description = programData.description;
    program.startDate = programData.startDate;
    program.endDate = programData.endDate;
    program.currency = programData.currency;
    program.distributionFrequency = programData.distributionFrequency;
    program.distributionDuration = programData.distributionDuration;
    program.fixedTransferValue = programData.fixedTransferValue;
    program.paymentAmountMultiplierFormula =
      programData.paymentAmountMultiplierFormula;
    program.targetNrRegistrations = programData.targetNrRegistrations;
    program.tryWhatsAppFirst = programData.tryWhatsAppFirst;
    program.meetingDocuments = programData.meetingDocuments;
    program.notifications = programData.notifications;
    program.phoneNumberPlaceholder = programData.phoneNumberPlaceholder;
    program.aboutProgram = programData.aboutProgram;
    program.fullnameNamingConvention = programData.fullnameNamingConvention;
    program.languages = programData.languages;
    program.enableMaxPayments = programData.enableMaxPayments;
    program.monitoringDashboardUrl = programData.monitoringDashboardUrl;
    program.evaluationDashboardUrl = programData.evaluationDashboardUrl;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();

    // Make sure to use these repositories in this transaction else save will be part of another transacion
    // This can lead to duplication of data
    const programRepository = queryRunner.manager.getRepository(ProgramEntity);
    const programQuestionRepository = queryRunner.manager.getRepository(
      ProgramQuestionEntity,
    );
    const programCustomAttributeRepository = queryRunner.manager.getRepository(
      ProgramCustomAttributeEntity,
    );

    try {
      const savedProgram = await programRepository.save(program);

      savedProgram.programCustomAttributes = [];
      for (const customAttribute of programData.programCustomAttributes) {
        customAttribute['programId'] = savedProgram.id;
        const customAttributeReturn =
          await programCustomAttributeRepository.save(customAttribute);
        savedProgram.programCustomAttributes.push(customAttributeReturn);
      }

      savedProgram.programQuestions = [];
      for (const programQuestion of programData.programQuestions) {
        const programQuestionEntity =
          this.programQuestionDtoToEntity(programQuestion);
        programQuestionEntity['programId'] = savedProgram.id;
        const programQuestionReturn = await programQuestionRepository.save(
          programQuestionEntity,
        );
        savedProgram.programQuestions.push(programQuestionReturn);
      }

      savedProgram.financialServiceProviders = [];
      for (const fspItem of programData.financialServiceProviders) {
        const fsp = await this.financialServiceProviderRepository.findOne({
          where: { fsp: fspItem.fsp },
        });
        if (!fsp) {
          const errors = `Create program error: No fsp found with name ${fspItem.fsp}`;
          await queryRunner.rollbackTransaction();
          throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
        }
        savedProgram.financialServiceProviders.push(fsp);
      }

      newProgram = await programRepository.save(savedProgram);
      await queryRunner.commitTransaction();
    } catch (err) {
      console.log('Error creating new program ', err);
      await queryRunner.rollbackTransaction();
      throw new HttpException(
        'Error creating new program',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
    await this.userService.assignAidworkerRolesAndAssignmentToProgram(
      newProgram.id,
      userId,
      {
        roles: [DefaultUserRole.ProgramAdmin],
      },
    );
    return newProgram;
  }

  public async deleteProgram(programId: number): Promise<void> {
    const program = await this.findProgramOrThrow(programId);
    await this.programRepository.remove(program);
  }

  public async updateProgram(
    programId: number,
    updateProgramDto: UpdateProgramDto,
  ): Promise<ProgramEntity> {
    const program = await this.findProgramOrThrow(programId);

    for (const attribute in updateProgramDto) {
      program[attribute] = updateProgramDto[attribute];
    }

    await this.programRepository.save(program);
    return program;
  }

  public async findProgramOrThrow(programId): Promise<ProgramEntity> {
    const program = await this.programRepository.findOneBy({
      id: programId,
    });
    if (!program) {
      const errors = `No program found with id ${programId}`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return program;
  }

  public async updateProgramCustomAttributes(
    programId: number,
    customAttributeId: number,
    updateProgramCustomAttributeDto: UpdateProgramCustomAttributeDto,
  ): Promise<ProgramCustomAttributeEntity> {
    const customAttribute = await this.programCustomAttributeRepository.findOne(
      {
        where: { id: customAttributeId, programId: programId },
      },
    );
    if (!customAttribute) {
      const errors = `No program custom attribute found with id ${customAttributeId} for program ${programId}`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    for (const property of Object.keys(updateProgramCustomAttributeDto)) {
      customAttribute[property] = updateProgramCustomAttributeDto[property];
    }
    return await this.programCustomAttributeRepository.save(customAttribute);
  }

  private async validateAttributeName(
    programId: number,
    name: string,
  ): Promise<void> {
    const existingAttributes = await this.getPaTableAttributes(programId);
    const existingNames = existingAttributes.map((attr) => {
      return attr.name;
    });
    if (existingNames.includes(name)) {
      const errors = `Unable to create program question/attribute with name ${name}. The names ${existingNames.join(
        ', ',
      )} are already in use`;
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }
    if (nameConstraintQuestionsArray.includes(name)) {
      const errors = `Unable to create program question/attribute with name ${name}. The names ${nameConstraintQuestionsArray.join(
        ', ',
      )} are forbidden to use`;
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }
  }

  public async createProgramCustomAttribute(
    programId: number,
    createProgramAttributeDto: CreateProgramCustomAttributeDto,
  ): Promise<ProgramCustomAttributeEntity> {
    await this.validateAttributeName(programId, createProgramAttributeDto.name);
    const programCustomAttribute = this.programCustomAttributeDtoToEntity(
      createProgramAttributeDto,
    );
    programCustomAttribute.programId = programId;
    try {
      return await this.programCustomAttributeRepository.save(
        programCustomAttribute,
      );
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const errorMessage = error.message; // Get the error message from QueryFailedError
        throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
      }
    }
  }

  private programCustomAttributeDtoToEntity(
    dto: CreateProgramCustomAttributeDto,
  ): ProgramCustomAttributeEntity {
    const programCustomAttribute = new ProgramCustomAttributeEntity();
    programCustomAttribute.name = dto.name;
    programCustomAttribute.type = dto.type;
    programCustomAttribute.label = dto.label;
    programCustomAttribute.phases = dto.phases;
    programCustomAttribute.duplicateCheck = dto.duplicateCheck;
    return programCustomAttribute;
  }

  public async createProgramQuestion(
    programId: number,
    createProgramQuestionDto: CreateProgramQuestionDto,
  ): Promise<ProgramQuestionEntity> {
    await this.validateAttributeName(programId, createProgramQuestionDto.name);
    const programQuestion = this.programQuestionDtoToEntity(
      createProgramQuestionDto,
    );
    programQuestion.programId = programId;

    try {
      return await this.programQuestionRepository.save(programQuestion);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const errorMessage = error.message; // Get the error message from QueryFailedError
        throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
      }
    }
  }

  private programQuestionDtoToEntity(
    dto: CreateProgramQuestionDto,
  ): ProgramQuestionEntity {
    const programQuestion = new ProgramQuestionEntity();
    programQuestion.name = dto.name;
    programQuestion.label = dto.label;
    programQuestion.answerType = dto.answerType;
    programQuestion.questionType = dto.questionType;
    programQuestion.options = dto.options;
    programQuestion.scoring = dto.scoring;
    programQuestion.persistence = dto.persistence;
    programQuestion.pattern = dto.pattern;
    programQuestion.phases = dto.phases;
    programQuestion.editableInPortal = dto.editableInPortal;
    programQuestion.export = dto.export as unknown as JSON;
    programQuestion.shortLabel = dto.shortLabel;
    programQuestion.duplicateCheck = dto.duplicateCheck;
    programQuestion.placeholder = dto.placeholder;
    return programQuestion;
  }

  public async updateProgramQuestion(
    programId: number,
    programQuestionId: number,
    updateProgramQuestionDto: UpdateProgramQuestionDto,
  ): Promise<ProgramQuestionEntity> {
    const programQuestion = await this.programQuestionRepository.findOne({
      where: {
        id: programQuestionId,
        programId: programId,
      },
    });
    if (!programQuestion) {
      const errors = `No programQuestion found with id ${programQuestionId} for program ${programId}`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    for (const attribute in updateProgramQuestionDto) {
      programQuestion[attribute] = updateProgramQuestionDto[attribute];
    }

    await this.programQuestionRepository.save(programQuestion);
    return programQuestion;
  }

  public async deleteProgramQuestion(
    programId: number,
    programQuestionId: number,
  ): Promise<ProgramQuestionEntity> {
    await this.findProgramOrThrow(programId);

    const programQuestion = await this.programQuestionRepository.findOne({
      where: { id: Number(programQuestionId) },
    });
    if (!programQuestion) {
      const errors = `Program question with id: '${programQuestionId}' not found.'`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return await this.programQuestionRepository.remove(programQuestion);
  }

  public async changePhase(
    programId: number,
    newPhase: ProgramPhase,
  ): Promise<SimpleProgramRO> {
    const oldPhase = (await this.programRepository.findOneBy({ id: programId }))
      .phase;
    await this.changeProgramValue(programId, {
      phase: newPhase,
    });
    const changedProgram = await this.findOne(programId);
    if (
      oldPhase === ProgramPhase.design &&
      newPhase === ProgramPhase.registrationValidation
    ) {
      await this.publish(programId);
    }
    return this.buildProgramRO(changedProgram);
  }

  public async publish(programId: number): Promise<SimpleProgramRO> {
    const selectedProgram = await this.findOne(programId);
    if (selectedProgram.published == true) {
      const errors = { Program: ' already published' };
      throw new HttpException({ errors }, HttpStatus.UNAUTHORIZED);
    }
    await this.changeProgramValue(programId, { published: true });

    const changedProgram = await this.findOne(programId);
    return await this.buildProgramRO(changedProgram);
  }

  private async changeProgramValue(
    programId: number,
    change: object,
  ): Promise<void> {
    await this.dataSource
      .getRepository(ProgramEntity)
      .createQueryBuilder()
      .update(ProgramEntity)
      .set(change)
      .where('id = :id', { id: programId })
      .execute();
  }

  private buildProgramRO(program: ProgramEntity): SimpleProgramRO {
    const simpleProgramRO = {
      id: program.id,
      titlePortal: program.titlePortal,
      phase: program.phase,
    };

    return simpleProgramRO;
  }

  public async getPaTableAttributes(
    programId: number,
    phase?: ProgramPhase,
    userId?: number,
  ): Promise<Attribute[]> {
    if (userId) {
      const hasPersonalRead = await this.userService.canActivate(
        [PermissionEnum.RegistrationPersonalREAD],
        programId,
        userId,
      );
      if (!hasPersonalRead) {
        // If a person does not have personal read permission we should
        // not show registration data columns in the portal
        return [];
      }
    }

    let queryCustomAttr = this.dataSource
      .getRepository(ProgramCustomAttributeEntity)
      .createQueryBuilder('programCustomAttribute')
      .where({ program: { id: programId } });

    if (phase) {
      queryCustomAttr = queryCustomAttr.andWhere(
        'programCustomAttribute.phases ::jsonb ?| :phases',
        { phases: [phase] },
      );
    }
    const rawCustomAttributes = await queryCustomAttr.getMany();
    const customAttributes = rawCustomAttributes.map((c) => {
      return {
        name: c.name,
        type: c.type,
        label: c.label,
        shortLabel: c.label,
        questionType: QuestionType.programCustomAttribute,
      };
    });

    let queryProgramQuestions = this.dataSource
      .getRepository(ProgramQuestionEntity)
      .createQueryBuilder('programQuestion')
      .where({ program: { id: programId } });

    if (phase) {
      queryProgramQuestions = queryProgramQuestions.andWhere(
        'programQuestion.phases ::jsonb ?| :phases',
        { phases: [phase] },
      );
    }
    const rawProgramQuestions = await queryProgramQuestions.getMany();
    const programQuestions = rawProgramQuestions.map((c) => {
      return {
        name: c.name,
        type: c.answerType,
        label: c.label,
        shortLabel: c.shortLabel,
        questionType: QuestionType.programQuestion,
      };
    });

    const program = await this.programRepository.findOne({
      where: { id: programId },
      relations: ['financialServiceProviders'],
    });
    const fspIds = program.financialServiceProviders.map((f) => f.id);

    let queryFspAttributes = this.dataSource
      .getRepository(FspQuestionEntity)
      .createQueryBuilder('fspAttribute')
      .where({ fspId: In(fspIds) });

    if (phase) {
      queryFspAttributes = queryFspAttributes.andWhere(
        'fspAttribute.phases ::jsonb ?| :phases',
        { phases: [phase] },
      );
    }
    const rawFspAttributes = await queryFspAttributes.getMany();
    const fspAttributes = rawFspAttributes.map((c) => {
      return {
        name: c.name,
        type: c.answerType,
        label: c.label,
        shortLabel: c.shortLabel,
        questionType: QuestionType.fspQuestion,
      };
    });

    return [...customAttributes, ...programQuestions, ...fspAttributes];
  }

  private async getPaEditableAttributes(
    programId: number,
  ): Promise<Attribute[]> {
    const customAttributes = (
      await this.programCustomAttributeRepository.find({
        where: { program: { id: programId } },
      })
    ).map((c) => {
      return {
        name: c.name,
        type: c.type,
        label: c.label,
        shortLabel: c.label,
      };
    });
    const programQuestions = (
      await this.programQuestionRepository.find({
        where: { program: { id: programId }, editableInPortal: true },
      })
    ).map((c) => {
      return {
        name: c.name,
        type: c.answerType,
        label: c.label,
        shortLabel: c.shortLabel,
      };
    });

    return [...customAttributes, ...programQuestions];
  }

  public async getAllRelationProgram(
    programId: number,
  ): Promise<RegistrationDataInfo[]> {
    const relations: RegistrationDataInfo[] = [];
    const programCustomAttributes =
      await this.programCustomAttributeRepository.find({
        where: { program: { id: programId } },
      });
    for (const attribute of programCustomAttributes) {
      relations.push({
        name: attribute.name,
        type: attribute.type,
        relation: {
          programCustomAttributeId: attribute.id,
        },
      });
    }

    const programQuestions = await this.programQuestionRepository.find({
      where: { program: { id: programId } },
    });

    for (const question of programQuestions) {
      relations.push({
        name: question.name,
        type: question.answerType,
        relation: {
          programQuestionId: question.id,
        },
      });
    }

    const fspAttributes = await this.fspAttributeRepository.find({
      relations: ['fsp', 'fsp.program'],
    });
    const programFspAttributes = fspAttributes.filter((a) =>
      a.fsp.program.map((p) => p.id).includes(programId),
    );

    for (const attribute of programFspAttributes) {
      relations.push({
        name: attribute.name,
        type: attribute.answerType,
        relation: {
          fspQuestionId: attribute.id,
        },
        fspId: attribute.fspId,
      });
    }

    return relations;
  }
}
