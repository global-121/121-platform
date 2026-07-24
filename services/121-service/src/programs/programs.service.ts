import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Equal, Repository } from 'typeorm';

import { GetTokenResult } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/interfaces/get-token-result.interface';
import { IntersolveVisaService } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/services/intersolve-visa.service';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';
import { ProgramFspConfigurationPropertyEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration-property.entity';
import { ProgramFspConfigurationMapper } from '@121-service/src/program-fsp-configurations/mappers/program-fsp-configuration.mapper';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramRegistrationAttributesService } from '@121-service/src/program-registration-attributes/program-registration-attributes.service';
import { CreateProgramDto } from '@121-service/src/programs/dto/create-program.dto';
import { FoundProgramDto } from '@121-service/src/programs/dto/found-program.dto';
import { ProgramReturnDto } from '@121-service/src/programs/dto/program-return.dto';
import { UpdateProgramDto } from '@121-service/src/programs/dto/update-program.dto';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';
import { ProgramRegistrationAttributeMapper } from '@121-service/src/programs/mappers/program-registration-attribute.mapper';
import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/program-aidworker-assignments/program-aidworker-assignment.entity';
import { ProgramApprovalThresholdEntity } from '@121-service/src/programs/program-approval-thresholds/program-approval-threshold.entity';
import { ProgramAttachmentsService } from '@121-service/src/programs/program-attachments/program-attachments.service';
import { RegistrationDataInfo } from '@121-service/src/registration/dto/registration-data-relation.model';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { DefaultUserRole } from '@121-service/src/user/enum/user-role.enum';
import { UserService } from '@121-service/src/user/user.service';

type ThresholdIdByOldId = Map<number | null, number | null>;

@Injectable()
export class ProgramService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(ProgramRegistrationAttributeEntity)
  private readonly programRegistrationAttributeRepository: Repository<ProgramRegistrationAttributeEntity>;

  public constructor(
    private readonly dataSource: DataSource,
    private readonly userService: UserService,
    private readonly programAttachmentsService: ProgramAttachmentsService,
    private readonly programRegistrationAttributesService: ProgramRegistrationAttributesService,
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
      await this.programRegistrationAttributesService.getPaEditableAttributes(
        program.id,
      );
    program['paTableAttributes'] =
      await this.programRegistrationAttributesService.getAttributes({
        programId: program.id,
        includeProgramRegistrationAttributes: true,
        includeTemplateDefaultAttributes: false,
      });

    // TODO: Get these attributes from some enum or something
    program['filterableAttributes'] =
      this.programRegistrationAttributesService.getFilterableAttributes(
        program,
      );

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
    if (!programData.programRegistrationAttributes) {
      return;
    }
    const programAttributeNames = programData.programRegistrationAttributes.map(
      (attr) => attr.name,
    );

    // Check if programAttributeNames has duplicate values
    const duplicateNames = programAttributeNames.filter(
      (item, index) => programAttributeNames.indexOf(item) !== index,
    );
    if (duplicateNames.length > 0) {
      const errors = `The following names: '${duplicateNames.join(
        ', ',
      )}' are used more than once in program registration attributes`;
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }
  }

  public async create(
    programData: CreateProgramDto,
    userId: number,
  ): Promise<ProgramEntity> {
    let newProgram;

    await this.validateProgram(programData);

    const fullnameNamingConvention =
      this.applyFullnameNamingConventionFallbackIfNecessary({
        namingConventionData: programData.fullnameNamingConvention,
      });
    const programRegistrationAttributes =
      await this.programRegistrationAttributesService.applyProgramRegistrationAttributesFallbackIfNecessary(
        {
          attributesData: programData.programRegistrationAttributes,
          namingConventionData: fullnameNamingConvention,
        },
      );

    const program = new ProgramEntity();
    program.validation = !!programData.validation;
    program.location = programData.location ?? null;
    program.ngo = programData.ngo ?? null;
    program.titlePortal = programData.titlePortal;
    program.description = programData.description ?? null;
    program.startDate = programData.startDate ?? null;
    program.endDate = programData.endDate ?? null;
    program.currency = programData.currency;
    program.distributionFrequency = programData.distributionFrequency ?? null;
    program.distributionDuration = programData.distributionDuration ?? null;
    program.fixedTransferValue = programData.fixedTransferValue ?? null;
    program.paymentAmountMultiplierFormula =
      programData.paymentAmountMultiplierFormula ?? null;
    program.targetNrRegistrations = programData.targetNrRegistrations ?? null;
    program.fullnameNamingConvention = fullnameNamingConvention;
    program.languages = programData.languages ?? [
      RegistrationPreferredLanguage.en,
    ];
    program.enableMaxPayments = !!programData.enableMaxPayments;
    program.enableScope = !!programData.enableScope;
    program.allowEmptyPhoneNumber = !!programData.allowEmptyPhoneNumber;
    program.monitoringDashboardUrl = programData.monitoringDashboardUrl ?? null;
    program.budget = programData.budget ?? null;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();

    // Make sure to use these repositories in this transaction else save will be part of another transaction
    // This can lead to duplication of data
    const programRepository = queryRunner.manager.getRepository(ProgramEntity);
    const programRegistrationAttributeRepository =
      queryRunner.manager.getRepository(ProgramRegistrationAttributeEntity);

    let savedProgram: ProgramEntity;
    try {
      savedProgram = await programRepository.save(program);

      savedProgram.programRegistrationAttributes = [];
      for (const programRegistrationAttribute of programRegistrationAttributes) {
        const createdAttribute =
          await this.programRegistrationAttributesService.createProgramRegistrationAttributeEntity(
            {
              // we save the program twice because we need a program id to create program registrations attributes
              programId: savedProgram.id,
              createProgramRegistrationAttribute: programRegistrationAttribute,
              repository: programRegistrationAttributeRepository,
            },
          );
        if (createdAttribute) {
          savedProgram.programRegistrationAttributes.push(createdAttribute);
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

    const creatingUser = await this.userService.findById(userId);
    const role = creatingUser.isOrganizationAdmin
      ? DefaultUserRole.ProgramAdmin
      : DefaultUserRole.Admin;

    await this.userService.assignAidworkerToProgram(newProgram.id, userId, {
      roles: [role],
      scope: undefined,
    });

    return newProgram;
  }

  public async deleteProgram(programId: number): Promise<void> {
    const program = await this.findProgramOrThrow(programId);
    await this.programAttachmentsService.deleteAllProgramAttachments(programId);
    await this.programRepository.remove(program as ProgramEntity);
  }

  public async duplicateProgram({
    copyFromProgramId,
    programData,
    userId,
  }: {
    copyFromProgramId: number;
    programData: CreateProgramDto;
    userId: number;
  }): Promise<ProgramEntity> {
    const sourceExists = await this.programRepository.exists({
      where: { id: Equal(copyFromProgramId) },
    });
    if (!sourceExists) {
      throw new HttpException(
        { errors: `No program found with id ${copyFromProgramId}` },
        HttpStatus.NOT_FOUND,
      );
    }

    const newProgram = await this.create(programData, userId);

    await this.duplicateFspConfigurations({
      sourceProgramId: copyFromProgramId,
      targetProgramId: newProgram.id,
    });

    const newThresholdIdByOldId = await this.duplicateApprovalThresholds({
      sourceProgramId: copyFromProgramId,
      targetProgramId: newProgram.id,
    });

    await this.duplicateAidworkerAssignments({
      sourceProgramId: copyFromProgramId,
      targetProgramId: newProgram.id,
      newThresholdIdByOldId,
    });

    return newProgram;
  }

  private async duplicateFspConfigurations({
    sourceProgramId,
    targetProgramId,
  }: {
    sourceProgramId: number;
    targetProgramId: number;
  }): Promise<void> {
    const fspConfigurationRepository = this.dataSource.getRepository(
      ProgramFspConfigurationEntity,
    );

    const propertyRepository = this.dataSource.getRepository(
      ProgramFspConfigurationPropertyEntity,
    );

    const sourceConfigurations = await fspConfigurationRepository.find({
      where: { programId: Equal(sourceProgramId) },
      relations: ['properties'],
    });

    for (const sourceConfiguration of sourceConfigurations) {
      const newConfiguration = await fspConfigurationRepository.save(
        fspConfigurationRepository.create({
          programId: targetProgramId,
          fspName: sourceConfiguration.fspName,
          name: sourceConfiguration.name,
          label: sourceConfiguration.label,
          state: sourceConfiguration.state,
        }),
      );

      await propertyRepository.save(
        sourceConfiguration.properties.map((property) =>
          propertyRepository.create({
            programFspConfigurationId: newConfiguration.id,
            name: property.name,
            value: property.value,
          }),
        ),
      );
    }
  }

  private async duplicateApprovalThresholds({
    sourceProgramId,
    targetProgramId,
  }: {
    sourceProgramId: number;
    targetProgramId: number;
  }): Promise<ThresholdIdByOldId> {
    const thresholdRepository = this.dataSource.getRepository(
      ProgramApprovalThresholdEntity,
    );
    const sourceThresholds = await thresholdRepository.find({
      where: { programId: Equal(sourceProgramId) },
    });

    const newThresholdIdByOldId: ThresholdIdByOldId = new Map([[null, null]]);

    for (const sourceThreshold of sourceThresholds) {
      const newThreshold = await thresholdRepository.save(
        thresholdRepository.create({
          programId: targetProgramId,
          thresholdAmount: sourceThreshold.thresholdAmount,
        }),
      );
      newThresholdIdByOldId.set(sourceThreshold.id, newThreshold.id);
    }

    return newThresholdIdByOldId;
  }

  private async duplicateAidworkerAssignments({
    sourceProgramId,
    targetProgramId,
    newThresholdIdByOldId,
  }: {
    sourceProgramId: number;
    targetProgramId: number;
    newThresholdIdByOldId: ThresholdIdByOldId;
  }): Promise<void> {
    const assignmentRepository = this.dataSource.getRepository(
      ProgramAidworkerAssignmentEntity,
    );
    const sourceAssignments = await assignmentRepository.find({
      where: { programId: Equal(sourceProgramId) },
      relations: ['roles'],
    });
    const targetAssignments = await assignmentRepository.find({
      where: { programId: Equal(targetProgramId) },
    });
    const alreadyAssignedUserIds = new Set(
      targetAssignments.map((assignment) => assignment.userId),
    );

    for (const sourceAssignment of sourceAssignments) {
      if (alreadyAssignedUserIds.has(sourceAssignment.userId)) {
        continue;
      }

      await assignmentRepository.save(
        assignmentRepository.create({
          programId: targetProgramId,
          userId: sourceAssignment.userId,
          scope: sourceAssignment.scope,
          roles: sourceAssignment.roles,
          programApprovalThresholdId: newThresholdIdByOldId.get(
            sourceAssignment.programApprovalThresholdId,
          ),
        }),
      );
    }
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

    for (const key in updateProgramDto) {
      program[key] = updateProgramDto[key];
    }

    const savedProgram = await this.programRepository.save(program);

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
      budget: program.budget ?? undefined,
      programRegistrationAttributes:
        ProgramRegistrationAttributeMapper.entitiesToDtos(
          program.programRegistrationAttributes,
        ),
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
        'FSP-configurations not found',
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

  private applyFullnameNamingConventionFallbackIfNecessary({
    namingConventionData,
  }: {
    namingConventionData: string[] | undefined;
  }): string[] {
    if (!namingConventionData || namingConventionData.length === 0) {
      return ['fullName'];
    }

    return namingConventionData;
  }
}
