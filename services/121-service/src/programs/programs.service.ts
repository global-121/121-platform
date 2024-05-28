import { ActionEntity } from '@121-service/src/actions/action.entity';
import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { FinancialServiceProviderEntity } from '@121-service/src/financial-service-providers/financial-service-provider.entity';
import { FspQuestionEntity } from '@121-service/src/financial-service-providers/fsp-question.entity';
import { ExportType } from '@121-service/src/metrics/dto/export-details.dto';
import { ProgramAttributesService } from '@121-service/src/program-attributes/program-attributes.service';
import {
  CreateProgramCustomAttributeDto,
  UpdateProgramCustomAttributeDto,
} from '@121-service/src/programs/dto/create-program-custom-attribute.dto';
import { CreateProgramDto } from '@121-service/src/programs/dto/create-program.dto';
import {
  CreateProgramQuestionDto,
  UpdateProgramQuestionDto,
} from '@121-service/src/programs/dto/program-question.dto';
import { ProgramReturnDto } from '@121-service/src/programs/dto/program-return.dto';
import { UpdateProgramDto } from '@121-service/src/programs/dto/update-program.dto';
import { ProgramFspConfigurationService } from '@121-service/src/programs/fsp-configuration/fsp-configuration.service';
import { ProgramFspConfigurationEntity } from '@121-service/src/programs/fsp-configuration/program-fsp-configuration.entity';
import { ProgramCustomAttributeEntity } from '@121-service/src/programs/program-custom-attribute.entity';
import { ProgramQuestionEntity } from '@121-service/src/programs/program-question.entity';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { ProgramsRO } from '@121-service/src/programs/program.interface';
import { overwriteProgramFspDisplayName } from '@121-service/src/programs/utils/overwrite-fsp-display-name.helper';
import { RegistrationDataInfo } from '@121-service/src/registration/dto/registration-data-relation.model';
import { nameConstraintQuestionsArray } from '@121-service/src/shared/const';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { DefaultUserRole } from '@121-service/src/user/user-role.enum';
import { UserService } from '@121-service/src/user/user.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, QueryFailedError, Repository } from 'typeorm';
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

  public async findProgramOrThrow(
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
      'programFspConfiguration',
    ];

    const program = await this.programRepository.findOne({
      where: { id: programId },
      relations: relations,
    });
    if (!program) {
      const errors = `No program found with id ${programId}`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    // Program attributes are queried separately because the performance is bad when using relations
    program.programCustomAttributes =
      await this.programCustomAttributeRepository.find({
        where: { program: { id: programId } },
      });

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
    }

    // over write fsp displayname by program specific displayName
    if (program.financialServiceProviders.length > 0) {
      program.financialServiceProviders = overwriteProgramFspDisplayName(
        program.financialServiceProviders,
        program.programFspConfiguration,
      );

      delete program.programFspConfiguration;
    }

    // TODO: REFACTOR: use DTO to define (stable) structure of data to return (not sure if transformation should be done here or in controller)
    return program;
  }

  public async getProgramReturnDto(
    programId: number,
    userId: number,
  ): Promise<ProgramReturnDto> {
    const programEntity = await this.findProgramOrThrow(programId, userId);
    if (!programEntity) {
      const errors = `No program found with id ${programId}`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    const programDto: ProgramReturnDto =
      this.fillProgramReturnDto(programEntity);
    return programDto;
  }

  public async getAssignedPrograms(userId: number): Promise<ProgramsRO> {
    const user =
      await this.userService.findUserProgramAssignmentsOrThrow(userId);
    const programIds = user.programAssignments.map((p) => p.program.id);
    let programs = await this.programRepository.find({
      where: { id: In(programIds) },
      relations: [
        'programQuestions',
        'programCustomAttributes',
        'financialServiceProviders',
        'financialServiceProviders.questions',
        'programFspConfiguration',
      ],
    });
    const programsCount = programs.length;

    if (programsCount > 0) {
      programs = programs.map((program) => {
        if (program.financialServiceProviders.length > 0) {
          program.financialServiceProviders = overwriteProgramFspDisplayName(
            program.financialServiceProviders,
            program.programFspConfiguration,
          );

          delete program.programFspConfiguration;
        }

        return program;
      });
    }

    return { programs, programsCount };
  }

  private async validateProgram(programData: CreateProgramDto): Promise<void> {
    if (
      !programData.financialServiceProviders ||
      !programData.programQuestions ||
      !programData.programCustomAttributes ||
      !programData.fullnameNamingConvention
    ) {
      const errors =
        'Required properties missing: `financialServiceProviders`, `programQuestions`, `programCustomAttributes` or `fullnameNamingConvention`';
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }

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
    program.location = programData.location;
    program.ngo = programData.ngo;
    program.titlePortal = programData.titlePortal;
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
    program.aboutProgram = programData.aboutProgram;
    program.fullnameNamingConvention = programData.fullnameNamingConvention;
    program.languages = programData.languages;
    program.enableMaxPayments = programData.enableMaxPayments;
    program.enableScope = programData.enableScope;
    program.allowEmptyPhoneNumber = programData.allowEmptyPhoneNumber;
    program.monitoringDashboardUrl = programData.monitoringDashboardUrl;

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
  ): Promise<ProgramReturnDto> {
    const program = await this.findProgramOrThrow(programId);

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

    const programDto: ProgramReturnDto =
      this.fillProgramReturnDto(savedProgram);
    return programDto;
  }

  // This function takes a filled ProgramEntity and returns a filled ProgramReturnDto
  private fillProgramReturnDto(program: ProgramEntity): ProgramReturnDto {
    const programDto: ProgramReturnDto = {
      id: program.id,
      published: program.published,
      validation: program.validation,
      location: program.location,
      ngo: program.ngo,
      titlePortal: program.titlePortal,
      description: program.description,
      startDate: program.startDate,
      endDate: program.endDate,
      currency: program.currency,
      distributionFrequency: program.distributionFrequency,
      distributionDuration: program.distributionDuration,
      fixedTransferValue: program.fixedTransferValue,
      paymentAmountMultiplierFormula: program.paymentAmountMultiplierFormula,
      financialServiceProviders: program.financialServiceProviders.map(
        (fsp) => {
          return {
            fsp: fsp.fsp as FinancialServiceProviderName,
            configuration: fsp.configuration,
          };
        },
      ),
      targetNrRegistrations: program.targetNrRegistrations,
      tryWhatsAppFirst: program.tryWhatsAppFirst,
      budget: program.budget,
      programCustomAttributes: program.programCustomAttributes.map(
        (programCustomAttribute) => {
          return {
            name: programCustomAttribute.name,
            type: programCustomAttribute.type,
            label: programCustomAttribute.label,
            showInPeopleAffectedTable:
              programCustomAttribute.showInPeopleAffectedTable,
            duplicateCheck: programCustomAttribute.duplicateCheck,
          };
        },
      ),
      programQuestions: program.programQuestions.map((programQuestion) => {
        return {
          name: programQuestion.name,
          label: programQuestion.label,
          answerType: programQuestion.answerType,
          questionType: programQuestion.questionType,
          options: programQuestion.options,
          scoring: programQuestion.scoring,
          persistence: programQuestion.persistence,
          pattern: programQuestion.pattern,
          showInPeopleAffectedTable: programQuestion.showInPeopleAffectedTable,
          editableInPortal: programQuestion.editableInPortal,
          export: programQuestion.export as unknown as ExportType[],
          duplicateCheck: programQuestion.duplicateCheck,
          placeholder: programQuestion.placeholder,
        };
      }),
      aboutProgram: program.aboutProgram,
      fullnameNamingConvention: program.fullnameNamingConvention,
      languages: program.languages,
      enableMaxPayments: program.enableMaxPayments,
      enableScope: program.enableScope,
      allowEmptyPhoneNumber: program.allowEmptyPhoneNumber,
    };
    if (program.monitoringDashboardUrl) {
      programDto.monitoringDashboardUrl = program.monitoringDashboardUrl;
    }

    return programDto;
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
    programQuestion.editableInPortal = dto.editableInPortal;
    programQuestion.export = dto.export;
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

  public async getFspConfigurations(
    programId: number,
    configName: string[],
  ): Promise<ProgramFspConfigurationEntity[]> {
    let programFspConfigurations =
      await this.programFspConfigurationService.findByProgramId(programId);
    if (configName.length > 0) {
      programFspConfigurations = programFspConfigurations.filter(
        (programFspConfiguration) =>
          configName.includes(programFspConfiguration.name),
      );
    }

    return programFspConfigurations;
  }
}
