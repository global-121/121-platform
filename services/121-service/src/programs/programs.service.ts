import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, QueryFailedError, Repository } from 'typeorm';
import { ActionEntity } from '../actions/action.entity';
import { FspName } from '../fsp/enum/fsp-name.enum';
import { FinancialServiceProviderEntity } from '../fsp/financial-service-provider.entity';
import { FspQuestionEntity } from '../fsp/fsp-question.entity';
import { ExportType } from '../metrics/dto/export-details.dto';
import { ProgramAttributesService } from '../program-attributes/program-attributes.service';
import { RegistrationDataInfo } from '../registration/dto/registration-data-relation.model';
import { nameConstraintQuestionsArray } from '../shared/const';
import { ProgramPhase } from '../shared/enum/program-phase.enum';
import { PermissionEnum } from '../user/enum/permission.enum';
import { DefaultUserRole } from '../user/user-role.enum';
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
import { ProgramFspConfigurationService } from './fsp-configuration/fsp-configuration.service';
import { ProgramCustomAttributeEntity } from './program-custom-attribute.entity';
import { ProgramQuestionEntity } from './program-question.entity';
import { ProgramEntity } from './program.entity';
import { ProgramsRO, SimpleProgramRO } from './program.interface';
@Injectable()
export class ProgramService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(ProgramQuestionEntity)
  private readonly programQuestionRepository: Repository<ProgramQuestionEntity>;
  @InjectRepository(ProgramCustomAttributeEntity)
  private readonly programCustomAttributeRepository: Repository<ProgramCustomAttributeEntity>;
  @InjectRepository(FspQuestionEntity)
  private readonly fspAttributeRepository: Repository<FspQuestionEntity>;
  @InjectRepository(FinancialServiceProviderEntity)
  public financialServiceProviderRepository: Repository<FinancialServiceProviderEntity>;
  @InjectRepository(ActionEntity)
  public actionRepository: Repository<ActionEntity>;

  public constructor(
    private readonly dataSource: DataSource,
    private readonly userService: UserService,
    private readonly programAttributesService: ProgramAttributesService,
    private readonly programFspConfigurationService: ProgramFspConfigurationService,
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
      program.editableAttributes =
        await this.programAttributesService.getPaEditableAttributes(program.id);
      program['paTableAttributes'] =
        await this.programAttributesService.getAttributes(
          program.id,
          true,
          true,
          true,
          false,
        );

      // TODO: Get these attributes from some enum or something
      program['filterableAttributes'] =
        this.programAttributesService.getFilterableAttributes(program);

      if (!includeMetricsUrl) {
        delete program.monitoringDashboardUrl;
        delete program.evaluationDashboardUrl;
      }
    }
    // TODO: REFACTOR: use DTO to define (stable) structure of data to return (not sure if transformation should be done here or in controller)
    return program;
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
            configuration: fsp.configuration,
          };
        },
      ),
      targetNrRegistrations: programEntity.targetNrRegistrations,
      tryWhatsAppFirst: programEntity.tryWhatsAppFirst,
      meetingDocuments: programEntity.meetingDocuments,
      budget: programEntity.budget,
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
      enableScope: programEntity.enableScope,
      allowEmptyPhoneNumber: programEntity.allowEmptyPhoneNumber,
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
    for (const program of programs) {
      delete program.monitoringDashboardUrl;
      delete program.evaluationDashboardUrl;
    }

    return { programs, programsCount };
  }

  public async getAssignedPrograms(userId: number): Promise<ProgramsRO> {
    const user =
      await this.userService.findUserProgramAssignmentsOrThrow(userId);
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
    program.phoneNumberPlaceholder = programData.phoneNumberPlaceholder;
    program.aboutProgram = programData.aboutProgram;
    program.fullnameNamingConvention = programData.fullnameNamingConvention;
    program.languages = programData.languages;
    program.enableMaxPayments = programData.enableMaxPayments;
    program.enableScope = programData.enableScope;
    program.allowEmptyPhoneNumber = programData.allowEmptyPhoneNumber;
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

    let savedProgram;
    try {
      savedProgram = await programRepository.save(program);

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

    // Loop through FSPs again to store config, which can only be done after program is saved
    for (const fspItem of programData.financialServiceProviders) {
      if (fspItem.configuration && fspItem.configuration?.length > 0) {
        for (const config of fspItem.configuration) {
          await this.programFspConfigurationService.create(newProgram.id, {
            fspId: savedProgram.financialServiceProviders.find(
              (f) => f.fsp === fspItem.fsp,
            ).id,
            name: config.name,
            value: config.value,
          });
        }
      }
    }

    await this.userService.assignAidworkerToProgram(newProgram.id, userId, {
      roles: [DefaultUserRole.Admin],
      scope: null,
    });
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
    // TODO: REFACTOR: combine .findOne and .findProgramOrThrow into one function? Yes, use .findOne and throw exception if not found.
    const program = await this.findOne(programId);

    // If nothing to update, raise a 400 Bad Request.
    if (Object.keys(updateProgramDto).length === 0) {
      throw new HttpException(
        'Update program error: no attributes supplied to update',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Overwrite any non-nested attributes of the program with the new supplued values.
    for (const attribute in updateProgramDto) {
      // Skip attribute financialServiceProviders, or all configured FSPs will be deleted. See processing of financialServiceProviders below.
      if (attribute !== 'financialServiceProviders') {
        program[attribute] = updateProgramDto[attribute];
      }
    }

    // Add newly supplied FSPs to the program.
    if (updateProgramDto.financialServiceProviders) {
      for (const fspItem of updateProgramDto.financialServiceProviders) {
        if (
          !program.financialServiceProviders.some(
            (fsp) => fsp.fsp === fspItem.fsp,
          )
        ) {
          const fsp = await this.financialServiceProviderRepository.findOne({
            where: { fsp: fspItem.fsp },
          });
          if (!fsp) {
            const errors = `Update program error: No fsp found with name ${fspItem.fsp}`;
            throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
          }
          program.financialServiceProviders.push(fsp);
        }
      }
    }

    let savedProgram: ProgramEntity;
    try {
      savedProgram = await this.programRepository.save(program);
    } catch (err) {
      console.log('Error updating program ', err);
      throw new HttpException(
        'Error updating program',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // TODO: REFACTOR: use respone DTO
    return savedProgram;
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
    const existingAttributes =
      await this.programAttributesService.getAttributes(
        programId,
        true,
        true,
        true,
        false,
      );
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
    await this.programRepository
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

  public async hasPersonalReadAccess(
    userId: number,
    programId: number,
  ): Promise<boolean> {
    return await this.userService.canActivate(
      [PermissionEnum.RegistrationPersonalREAD],
      programId,
      userId,
    );
  }
}
