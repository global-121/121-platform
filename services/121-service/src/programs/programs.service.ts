import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Equal, QueryFailedError, Repository } from 'typeorm';

import { ActionEntity } from '@121-service/src/actions/action.entity';
import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsps/enums/fsp-name.enum';
import { GetTokenResult } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/get-token-result.interface';
import { IntersolveVisaService } from '@121-service/src/payments/fsp-integration/intersolve-visa/services/intersolve-visa.service';
import { ProgramAttributesService } from '@121-service/src/program-attributes/program-attributes.service';
import { ProgramFspConfigurationPropertyEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration-property.entity';
import { ProgramFspConfigurationMapper } from '@121-service/src/program-fsp-configurations/mappers/program-fsp-configuration.mapper';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { CreateProgramDto } from '@121-service/src/programs/dto/create-program.dto';
import { FoundProgramDto } from '@121-service/src/programs/dto/found-program.dto';
import {
  ProgramRegistrationAttributeDto,
  UpdateProgramRegistrationAttributeDto,
} from '@121-service/src/programs/dto/program-registration-attribute.dto';
import { ProgramReturnDto } from '@121-service/src/programs/dto/program-return.dto';
import { UpdateProgramDto } from '@121-service/src/programs/dto/update-program.dto';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';
import { ProgramRegistrationAttributeMapper } from '@121-service/src/programs/mappers/program-registration-attribute.mapper';
import { ProgramAttachmentsService } from '@121-service/src/programs/program-attachments/program-attachments.service';
import { RegistrationDataInfo } from '@121-service/src/registration/dto/registration-data-relation.model';
import { nameConstraintQuestionsArray } from '@121-service/src/shared/const';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { DefaultUserRole } from '@121-service/src/user/enum/user-role.enum';
import { UserService } from '@121-service/src/user/user.service';

@Injectable()
export class ProgramService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(ProgramRegistrationAttributeEntity)
  private readonly programRegistrationAttributeRepository: Repository<ProgramRegistrationAttributeEntity>;
  @InjectRepository(ActionEntity)
  public actionRepository: Repository<ActionEntity>;

  public constructor(
    private readonly dataSource: DataSource,
    private readonly userService: UserService,
    private readonly programAttachmentsService: ProgramAttachmentsService,
    private readonly programAttributesService: ProgramAttributesService,
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
    private readonly intersolveVisaService: IntersolveVisaService,
  ) {}

  public async findProgramOrThrow(
    programId: number,
    userId?: number,
  ): Promise<FoundProgramDto> {
    let includeMetricsUrl = false;
    if (userId) {
      includeMetricsUrl = await this.userService.canActivate(
        [PermissionEnum.ProgramMetricsREAD],
        programId,
        userId,
      );
    }

    const relations = ['programFspConfigurations'];

    const program = await this.programRepository.findOne({
      where: { id: Equal(programId) },
      relations,
    });
    if (!program) {
      const errors = `No program found with id ${programId}`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    program.programRegistrationAttributes =
      await this.programRegistrationAttributeRepository.find({
        where: { program: { id: Equal(programId) } },
      });

    program.editableAttributes =
      await this.programAttributesService.getPaEditableAttributes(program.id);
    program['paTableAttributes'] =
      await this.programAttributesService.getAttributes({
        programId: program.id,
        includeProgramRegistrationAttributes: true,
        includeTemplateDefaultAttributes: false,
      });

    // TODO: Get these attributes from some enum or something
    program['filterableAttributes'] =
      this.programAttributesService.getFilterableAttributes(program);

    program['fspConfigurations'] =
      ProgramFspConfigurationMapper.mapEntitiesToDtos(
        program.programFspConfigurations,
      );
    const outputProgram: FoundProgramDto = program;

    // TODO: REFACTOR: use DTO to define (stable) structure of data to return (not sure if transformation should be done here or in controller)
    if (!includeMetricsUrl) {
      delete outputProgram.monitoringDashboardUrl;
    }
    return outputProgram;
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

  private async validateProgram(programData: CreateProgramDto): Promise<void> {
    if (
      !programData.programRegistrationAttributes ||
      !programData.fullnameNamingConvention
    ) {
      const errors =
        'Required properties missing: `programRegistrationAttributes` or `fullnameNamingConvention`';
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }

    const programAttributeNames = programData.programRegistrationAttributes.map(
      (ca) => ca.name,
    );

    for (const name of Object.values(programData.fullnameNamingConvention)) {
      if (!programAttributeNames.includes(name)) {
        const errors = `Element '${name}' of fullnameNamingConvention is not found in program registration attributes`;
        throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
      }
    }
    // Check if programAttributeNames has duplicate values
    const duplicateNames = programAttributeNames.filter(
      (item, index) => programAttributeNames.indexOf(item) !== index,
    );
    if (duplicateNames.length > 0) {
      const errors = `The following names: '${duplicateNames.join(
        ', ',
      )}' are used more than once program registration attributes`;
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
    program.validation = programData.validation;
    program.location = programData.location;
    program.ngo = programData.ngo;
    program.titlePortal = programData.titlePortal;
    program.description = programData.description ?? null;
    program.startDate = programData.startDate;
    program.endDate = programData.endDate;
    program.currency = programData.currency;
    program.distributionFrequency = programData.distributionFrequency;
    program.distributionDuration = programData.distributionDuration;
    program.fixedTransferValue = programData.fixedTransferValue;
    program.paymentAmountMultiplierFormula =
      programData.paymentAmountMultiplierFormula ?? null;
    program.targetNrRegistrations = programData.targetNrRegistrations;
    program.tryWhatsAppFirst = programData.tryWhatsAppFirst;
    program.aboutProgram = programData.aboutProgram;
    program.fullnameNamingConvention = programData.fullnameNamingConvention;
    program.languages = programData.languages;
    program.enableMaxPayments = programData.enableMaxPayments;
    program.enableScope = programData.enableScope;
    program.allowEmptyPhoneNumber = programData.allowEmptyPhoneNumber;
    program.monitoringDashboardUrl = programData.monitoringDashboardUrl ?? null;
    program.budget = programData.budget ?? null;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();

    // Make sure to use these repositories in this transaction else save will be part of another transacion
    // This can lead to duplication of data
    const programRepository = queryRunner.manager.getRepository(ProgramEntity);
    const programRegistrationAttributeRepository =
      queryRunner.manager.getRepository(ProgramRegistrationAttributeEntity);

    let savedProgram: ProgramEntity;
    try {
      savedProgram = await programRepository.save(program);

      savedProgram.programRegistrationAttributes = [];
      for (const programRegistrationAttribute of programData.programRegistrationAttributes) {
        const attributeReturn =
          await this.createProgramRegistrationAttributeEntity({
            programId: savedProgram.id,
            createProgramRegistrationAttributeDto: programRegistrationAttribute,
            repository: programRegistrationAttributeRepository,
          });
        if (attributeReturn) {
          savedProgram.programRegistrationAttributes.push(attributeReturn);
        }
      }

      newProgram = await programRepository.save(savedProgram);
      await queryRunner.commitTransaction();
    } catch (err) {
      console.log('Error creating new program ', err);
      await queryRunner.rollbackTransaction();
      if (err instanceof HttpException) {
        throw err;
      } else {
        throw new HttpException(
          'Error creating new program',
          HttpStatus.BAD_GATEWAY,
        );
      }
    } finally {
      await queryRunner.release();
    }

    await this.userService.assignAidworkerToProgram(newProgram.id, userId, {
      roles: [DefaultUserRole.Admin],
      scope: undefined,
    });
    return newProgram;
  }

  public async deleteProgram(programId: number): Promise<void> {
    const program = await this.findProgramOrThrow(programId);
    await this.programAttachmentsService.deleteAllProgramAttachments(programId);
    await this.programRepository.remove(program as ProgramEntity);
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
      // Skip attribute fsps, or all configured FSPs will be deleted. See processing of fsps below.
      if (attribute !== 'programFspConfigurations') {
        program[attribute] = updateProgramDto[attribute];
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
  private fillProgramReturnDto(program: FoundProgramDto): ProgramReturnDto {
    const programDto: ProgramReturnDto = {
      id: program.id,
      validation: program.validation,
      location: program.location ?? undefined,
      ngo: program.ngo ?? undefined,
      titlePortal: program.titlePortal ?? undefined,
      description: program.description ?? undefined,
      startDate: program.startDate ?? undefined,
      endDate: program.endDate ?? undefined,
      currency: program.currency ?? undefined,
      distributionFrequency: program.distributionFrequency ?? undefined,
      distributionDuration: program.distributionDuration ?? undefined,
      fixedTransferValue: program.fixedTransferValue ?? undefined,
      paymentAmountMultiplierFormula:
        program.paymentAmountMultiplierFormula ?? undefined,
      fspConfigurations: ProgramFspConfigurationMapper.mapEntitiesToDtos(
        program.programFspConfigurations,
      ),
      targetNrRegistrations: program.targetNrRegistrations ?? undefined,
      tryWhatsAppFirst: program.tryWhatsAppFirst,
      budget: program.budget ?? undefined,
      programRegistrationAttributes:
        ProgramRegistrationAttributeMapper.entitiesToDtos(
          program.programRegistrationAttributes,
        ),
      aboutProgram: program.aboutProgram ?? undefined,
      fullnameNamingConvention: program.fullnameNamingConvention ?? undefined,
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

  private async validateAttributeName(
    programId: number,
    name: string,
  ): Promise<void> {
    const existingAttributes =
      await this.programAttributesService.getAttributes({
        programId,
        includeProgramRegistrationAttributes: true,
        includeTemplateDefaultAttributes: false,
      });
    const existingNames = existingAttributes.map((attr) => {
      return attr.name;
    });
    if (existingNames.includes(name)) {
      const errors = `Unable to create program registration attribute with name ${name}. The names ${existingNames.join(
        ', ',
      )} are already in use`;
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }
    if (nameConstraintQuestionsArray.includes(name)) {
      const errors = `Unable to create program registration attribute with name ${name}. The names ${nameConstraintQuestionsArray.join(
        ', ',
      )} are forbidden to use`;
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }
  }

  public async createProgramRegistrationAttribute({
    programId,
    createProgramRegistrationAttributeDto,
  }: {
    programId: number;
    createProgramRegistrationAttributeDto: ProgramRegistrationAttributeDto;
  }): Promise<ProgramRegistrationAttributeDto> {
    const entity = await this.createProgramRegistrationAttributeEntity({
      programId,
      createProgramRegistrationAttributeDto,
    });
    return ProgramRegistrationAttributeMapper.entityToDto(entity);
  }

  private async createProgramRegistrationAttributeEntity({
    programId,
    createProgramRegistrationAttributeDto,
    repository,
  }: {
    programId: number;
    createProgramRegistrationAttributeDto: ProgramRegistrationAttributeDto;
    repository?: Repository<ProgramRegistrationAttributeEntity>;
  }): Promise<ProgramRegistrationAttributeEntity> {
    await this.validateAttributeName(
      programId,
      createProgramRegistrationAttributeDto.name,
    );
    const programRegistrationAttribute =
      this.programRegistrationAttributeDtoToEntity(
        createProgramRegistrationAttributeDto,
      );
    programRegistrationAttribute.programId = programId;

    try {
      if (repository) {
        return await repository.save(programRegistrationAttribute);
      } else {
        return await this.programRegistrationAttributeRepository.save(
          programRegistrationAttribute,
        );
      }
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const errorMessage = error.message; // Get the error message from QueryFailedError
        throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
      }
      // Unexpected error
      throw error;
    }
  }

  private programRegistrationAttributeDtoToEntity(
    dto: ProgramRegistrationAttributeDto,
  ): ProgramRegistrationAttributeEntity {
    const programRegistrationAttribute =
      new ProgramRegistrationAttributeEntity();
    programRegistrationAttribute.name = dto.name;
    programRegistrationAttribute.label = dto.label;
    programRegistrationAttribute.type = dto.type;
    programRegistrationAttribute.options = dto.options ?? null;
    programRegistrationAttribute.scoring = dto.scoring ?? {};
    programRegistrationAttribute.pattern = dto.pattern ?? null;
    programRegistrationAttribute.editableInPortal =
      dto.editableInPortal ?? false;
    programRegistrationAttribute.includeInTransactionExport =
      dto.includeInTransactionExport ?? false;
    programRegistrationAttribute.duplicateCheck = dto.duplicateCheck ?? false;
    programRegistrationAttribute.placeholder = dto.placeholder ?? null;
    programRegistrationAttribute.isRequired = dto.isRequired ?? false;
    programRegistrationAttribute.showInPeopleAffectedTable =
      dto.showInPeopleAffectedTable ?? false;
    return programRegistrationAttribute;
  }

  public async updateProgramRegistrationAttribute(
    programId: number,
    programRegistrationAttributeName: string,
    updateProgramRegistrationAttribute: UpdateProgramRegistrationAttributeDto,
  ): Promise<ProgramRegistrationAttributeEntity> {
    const programRegistrationAttribute =
      await this.programRegistrationAttributeRepository.findOne({
        where: {
          name: Equal(programRegistrationAttributeName),
          programId: Equal(programId),
        },
      });
    if (!programRegistrationAttribute) {
      const errors = `No programRegistrationAttribute found with name ${programRegistrationAttributeName} for program ${programId}`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    for (const attribute in updateProgramRegistrationAttribute) {
      programRegistrationAttribute[attribute] =
        updateProgramRegistrationAttribute[attribute];
    }

    await this.programRegistrationAttributeRepository.save(
      programRegistrationAttribute,
    );
    return programRegistrationAttribute;
  }

  public async deleteProgramRegistrationAttribute(
    programId: number,
    programRegistrationAttributeId: number,
  ): Promise<ProgramRegistrationAttributeEntity> {
    await this.findProgramOrThrow(programId);

    const programRegistrationAttribute =
      await this.programRegistrationAttributeRepository.findOne({
        where: { id: Number(programRegistrationAttributeId) },
      });
    if (!programRegistrationAttribute) {
      const errors = `Program registration attribute with id: '${programRegistrationAttributeId}' not found.'`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return await this.programRegistrationAttributeRepository.remove(
      programRegistrationAttribute,
    );
  }

  public async getAllRelationProgram(
    programId: number,
  ): Promise<RegistrationDataInfo[]> {
    const relations: RegistrationDataInfo[] = [];

    const programRegistrationAttributes =
      await this.programRegistrationAttributeRepository.find({
        where: { program: { id: Equal(programId) } },
      });
    for (const attribute of programRegistrationAttributes) {
      relations.push({
        name: attribute.name,
        type: attribute.type,
        relation: {
          programRegistrationAttributeId: attribute.id,
        },
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

  public async getFundingWallet(programId: number) {
    // TODO: Refactor ensure this works with the new structure of FSP configuration properties
    const programFspConfigurations =
      await this.programFspConfigurationRepository.getByProgramIdAndFspName({
        programId,
        fspName: Fsps.intersolveVisa,
      });
    if (!programFspConfigurations) {
      throw new HttpException(
        'Fsp configurations not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // add all properties to a single array
    const properties: ProgramFspConfigurationPropertyEntity[] = [];
    for (const programFspConfiguration of programFspConfigurations) {
      properties.push(...programFspConfiguration.properties);
    }

    const fundingTokenConfigurationProperties = properties.filter(
      (config) => config.name === FspConfigurationProperties.fundingTokenCode,
    );
    if (
      !fundingTokenConfigurationProperties ||
      fundingTokenConfigurationProperties.length === 0
    ) {
      throw new HttpException(
        'Funding token configuration property not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // loop over all properties and return all wallets as an array
    const wallets: GetTokenResult[] = [];
    for (const property of properties) {
      if (property.name === FspConfigurationProperties.fundingTokenCode) {
        const wallet = await this.intersolveVisaService.getWallet(
          property.value as string,
        );
        wallets.push(wallet);
      }
    }
    return wallets;
  }
}
