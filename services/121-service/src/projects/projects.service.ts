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
import { ProjectAttributesService } from '@121-service/src/project-attributes/project-attributes.service';
import { ProjectFspConfigurationPropertyEntity } from '@121-service/src/project-fsp-configurations/entities/project-fsp-configuration-property.entity';
import { ProjectFspConfigurationMapper } from '@121-service/src/project-fsp-configurations/mappers/project-fsp-configuration.mapper';
import { ProjectFspConfigurationRepository } from '@121-service/src/project-fsp-configurations/project-fsp-configurations.repository';
import { CreateProjectDto } from '@121-service/src/projects/dto/create-project.dto';
import { FoundProjectDto } from '@121-service/src/projects/dto/found-project.dto';
import {
  ProjectRegistrationAttributeDto,
  UpdateProjectRegistrationAttributeDto,
} from '@121-service/src/projects/dto/project-registration-attribute.dto';
import { ProjectReturnDto } from '@121-service/src/projects/dto/project-return.dto';
import { UpdateProjectDto } from '@121-service/src/projects/dto/update-project.dto';
import { ProjectRegistrationAttributeMapper } from '@121-service/src/projects/mappers/project-registration-attribute.mapper';
import { ProjectEntity } from '@121-service/src/projects/project.entity';
import { ProjectAttachmentsService } from '@121-service/src/projects/project-attachments/project-attachments.service';
import { ProjectRegistrationAttributeEntity } from '@121-service/src/projects/project-registration-attribute.entity';
import { RegistrationDataInfo } from '@121-service/src/registration/dto/registration-data-relation.model';
import { nameConstraintQuestionsArray } from '@121-service/src/shared/const';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { UserService } from '@121-service/src/user/user.service';
import { DefaultUserRole } from '@121-service/src/user/user-role.enum';

@Injectable()
export class ProjectService {
  @InjectRepository(ProjectEntity)
  private readonly projectRepository: Repository<ProjectEntity>;
  @InjectRepository(ProjectRegistrationAttributeEntity)
  private readonly projectRegistrationAttributeRepository: Repository<ProjectRegistrationAttributeEntity>;
  @InjectRepository(ActionEntity)
  public actionRepository: Repository<ActionEntity>;

  public constructor(
    private readonly dataSource: DataSource,
    private readonly userService: UserService,
    private readonly projectAttachmentsService: ProjectAttachmentsService,
    private readonly projectAttributesService: ProjectAttributesService,
    private readonly projectFspConfigurationRepository: ProjectFspConfigurationRepository,
    private readonly intersolveVisaService: IntersolveVisaService,
  ) {}

  public async findProjectOrThrow(
    projectId: number,
    userId?: number,
  ): Promise<FoundProjectDto> {
    let includeMetricsUrl = false;
    if (userId) {
      includeMetricsUrl = await this.userService.canActivate(
        [PermissionEnum.ProjectMetricsREAD],
        projectId,
        userId,
      );
    }

    const relations = ['projectFspConfigurations'];

    const project = await this.projectRepository.findOne({
      where: { id: Equal(projectId) },
      relations,
    });
    if (!project) {
      const errors = `No project found with id ${projectId}`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    project.projectRegistrationAttributes =
      await this.projectRegistrationAttributeRepository.find({
        where: { project: { id: Equal(projectId) } },
      });

    project.editableAttributes =
      await this.projectAttributesService.getPaEditableAttributes(project.id);
    project['paTableAttributes'] =
      await this.projectAttributesService.getAttributes({
        projectId: project.id,
        includeProjectRegistrationAttributes: true,
        includeTemplateDefaultAttributes: false,
      });

    // TODO: Get these attributes from some enum or something
    project['filterableAttributes'] =
      this.projectAttributesService.getFilterableAttributes(project);

    project['fspConfigurations'] =
      ProjectFspConfigurationMapper.mapEntitiesToDtos(
        project.projectFspConfigurations,
      );
    const outputProject: FoundProjectDto = project;

    // TODO: REFACTOR: use DTO to define (stable) structure of data to return (not sure if transformation should be done here or in controller)
    if (!includeMetricsUrl) {
      delete outputProject.monitoringDashboardUrl;
    }
    return outputProject;
  }

  public async getProjectReturnDto(
    projectId: number,
    userId: number,
  ): Promise<ProjectReturnDto> {
    const projectEntity = await this.findProjectOrThrow(projectId, userId);
    if (!projectEntity) {
      const errors = `No project found with id ${projectId}`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    const projectDto: ProjectReturnDto =
      this.fillProjectReturnDto(projectEntity);
    return projectDto;
  }

  private async validateProject(projectData: CreateProjectDto): Promise<void> {
    if (
      !projectData.projectRegistrationAttributes ||
      !projectData.fullnameNamingConvention
    ) {
      const errors =
        'Required properties missing: `projectRegistrationAttributes` or `fullnameNamingConvention`';
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }

    const projectAttributeNames = projectData.projectRegistrationAttributes.map(
      (ca) => ca.name,
    );

    for (const name of Object.values(projectData.fullnameNamingConvention)) {
      if (!projectAttributeNames.includes(name)) {
        const errors = `Element '${name}' of fullnameNamingConvention is not found in project registration attributes`;
        throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
      }
    }
    // Check if projectAttributeNames has duplicate values
    const duplicateNames = projectAttributeNames.filter(
      (item, index) => projectAttributeNames.indexOf(item) !== index,
    );
    if (duplicateNames.length > 0) {
      const errors = `The following names: '${duplicateNames.join(
        ', ',
      )}' are used more than once project registration attributes`;
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }
  }

  public async create(
    projectData: CreateProjectDto,
    userId: number,
  ): Promise<ProjectEntity> {
    let newProject;

    await this.validateProject(projectData);
    const project = new ProjectEntity();
    project.published = projectData.published;
    project.validation = projectData.validation;
    project.location = projectData.location;
    project.ngo = projectData.ngo;
    project.titlePortal = projectData.titlePortal;
    project.description = projectData.description ?? null;
    project.startDate = projectData.startDate;
    project.endDate = projectData.endDate;
    project.currency = projectData.currency;
    project.distributionFrequency = projectData.distributionFrequency;
    project.distributionDuration = projectData.distributionDuration;
    project.fixedTransferValue = projectData.fixedTransferValue;
    project.paymentAmountMultiplierFormula =
      projectData.paymentAmountMultiplierFormula ?? null;
    project.targetNrRegistrations = projectData.targetNrRegistrations;
    project.tryWhatsAppFirst = projectData.tryWhatsAppFirst;
    project.aboutProject = projectData.aboutProject;
    project.fullnameNamingConvention = projectData.fullnameNamingConvention;
    project.languages = projectData.languages;
    project.enableMaxPayments = projectData.enableMaxPayments;
    project.enableScope = projectData.enableScope;
    project.allowEmptyPhoneNumber = projectData.allowEmptyPhoneNumber;
    project.monitoringDashboardUrl = projectData.monitoringDashboardUrl ?? null;
    project.budget = projectData.budget ?? null;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();

    // Make sure to use these repositories in this transaction else save will be part of another transacion
    // This can lead to duplication of data
    const projectRepository = queryRunner.manager.getRepository(ProjectEntity);
    const projectRegistrationAttributeRepository =
      queryRunner.manager.getRepository(ProjectRegistrationAttributeEntity);

    let savedProject: ProjectEntity;
    try {
      savedProject = await projectRepository.save(project);

      savedProject.projectRegistrationAttributes = [];
      for (const projectRegistrationAttribute of projectData.projectRegistrationAttributes) {
        const attributeReturn =
          await this.createProjectRegistrationAttributeEntity({
            projectId: savedProject.id,
            createProjectRegistrationAttributeDto: projectRegistrationAttribute,
            repository: projectRegistrationAttributeRepository,
          });
        if (attributeReturn) {
          savedProject.projectRegistrationAttributes.push(attributeReturn);
        }
      }

      newProject = await projectRepository.save(savedProject);
      await queryRunner.commitTransaction();
    } catch (err) {
      console.log('Error creating new project ', err);
      await queryRunner.rollbackTransaction();
      if (err instanceof HttpException) {
        throw err;
      } else {
        throw new HttpException(
          'Error creating new project',
          HttpStatus.BAD_GATEWAY,
        );
      }
    } finally {
      await queryRunner.release();
    }

    await this.userService.assignAidworkerToProject(newProject.id, userId, {
      roles: [DefaultUserRole.Admin],
      scope: undefined,
    });
    return newProject;
  }

  public async deleteProject(projectId: number): Promise<void> {
    const project = await this.findProjectOrThrow(projectId);
    await this.projectAttachmentsService.deleteAllProjectAttachments(projectId);
    await this.projectRepository.remove(project as ProjectEntity);
  }

  public async updateProject(
    projectId: number,
    updateProjectDto: UpdateProjectDto,
  ): Promise<ProjectReturnDto> {
    const project = await this.findProjectOrThrow(projectId);

    // If nothing to update, raise a 400 Bad Request.
    if (Object.keys(updateProjectDto).length === 0) {
      throw new HttpException(
        'Update project error: no attributes supplied to update',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Overwrite any non-nested attributes of the project with the new supplued values.
    for (const attribute in updateProjectDto) {
      // Skip attribute fsps, or all configured FSPs will be deleted. See processing of fsps below.
      if (attribute !== 'projectFspConfigurations') {
        project[attribute] = updateProjectDto[attribute];
      }
    }

    let savedProject: ProjectEntity;
    try {
      savedProject = await this.projectRepository.save(project);
    } catch (err) {
      console.log('Error updating project ', err);
      throw new HttpException(
        'Error updating project',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const projectDto: ProjectReturnDto =
      this.fillProjectReturnDto(savedProject);
    return projectDto;
  }

  // This function takes a filled ProjectEntity and returns a filled ProjectReturnDto
  private fillProjectReturnDto(project: FoundProjectDto): ProjectReturnDto {
    const projectDto: ProjectReturnDto = {
      id: project.id,
      published: project.published,
      validation: project.validation,
      location: project.location ?? undefined,
      ngo: project.ngo ?? undefined,
      titlePortal: project.titlePortal ?? undefined,
      description: project.description ?? undefined,
      startDate: project.startDate ?? undefined,
      endDate: project.endDate ?? undefined,
      currency: project.currency ?? undefined,
      distributionFrequency: project.distributionFrequency ?? undefined,
      distributionDuration: project.distributionDuration ?? undefined,
      fixedTransferValue: project.fixedTransferValue ?? undefined,
      paymentAmountMultiplierFormula:
        project.paymentAmountMultiplierFormula ?? undefined,
      fspConfigurations: ProjectFspConfigurationMapper.mapEntitiesToDtos(
        project.projectFspConfigurations,
      ),
      targetNrRegistrations: project.targetNrRegistrations ?? undefined,
      tryWhatsAppFirst: project.tryWhatsAppFirst,
      budget: project.budget ?? undefined,
      projectRegistrationAttributes:
        ProjectRegistrationAttributeMapper.entitiesToDtos(
          project.projectRegistrationAttributes,
        ),
      aboutProject: project.aboutProject ?? undefined,
      fullnameNamingConvention: project.fullnameNamingConvention ?? undefined,
      languages: project.languages,
      enableMaxPayments: project.enableMaxPayments,
      enableScope: project.enableScope,
      allowEmptyPhoneNumber: project.allowEmptyPhoneNumber,
    };
    if (project.monitoringDashboardUrl) {
      projectDto.monitoringDashboardUrl = project.monitoringDashboardUrl;
    }

    return projectDto;
  }

  private async validateAttributeName(
    projectId: number,
    name: string,
  ): Promise<void> {
    const existingAttributes =
      await this.projectAttributesService.getAttributes({
        projectId,
        includeProjectRegistrationAttributes: true,
        includeTemplateDefaultAttributes: false,
      });
    const existingNames = existingAttributes.map((attr) => {
      return attr.name;
    });
    if (existingNames.includes(name)) {
      const errors = `Unable to create project registration attribute with name ${name}. The names ${existingNames.join(
        ', ',
      )} are already in use`;
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }
    if (nameConstraintQuestionsArray.includes(name)) {
      const errors = `Unable to create project registration attribute with name ${name}. The names ${nameConstraintQuestionsArray.join(
        ', ',
      )} are forbidden to use`;
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }
  }

  public async createProjectRegistrationAttribute({
    projectId,
    createProjectRegistrationAttributeDto,
  }: {
    projectId: number;
    createProjectRegistrationAttributeDto: ProjectRegistrationAttributeDto;
  }): Promise<ProjectRegistrationAttributeDto> {
    const entity = await this.createProjectRegistrationAttributeEntity({
      projectId,
      createProjectRegistrationAttributeDto,
    });
    return ProjectRegistrationAttributeMapper.entityToDto(entity);
  }

  private async createProjectRegistrationAttributeEntity({
    projectId,
    createProjectRegistrationAttributeDto,
    repository,
  }: {
    projectId: number;
    createProjectRegistrationAttributeDto: ProjectRegistrationAttributeDto;
    repository?: Repository<ProjectRegistrationAttributeEntity>;
  }): Promise<ProjectRegistrationAttributeEntity> {
    await this.validateAttributeName(
      projectId,
      createProjectRegistrationAttributeDto.name,
    );
    const projectRegistrationAttribute =
      this.projectRegistrationAttributeDtoToEntity(
        createProjectRegistrationAttributeDto,
      );
    projectRegistrationAttribute.projectId = projectId;

    try {
      if (repository) {
        return await repository.save(projectRegistrationAttribute);
      } else {
        return await this.projectRegistrationAttributeRepository.save(
          projectRegistrationAttribute,
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

  private projectRegistrationAttributeDtoToEntity(
    dto: ProjectRegistrationAttributeDto,
  ): ProjectRegistrationAttributeEntity {
    const projectRegistrationAttribute =
      new ProjectRegistrationAttributeEntity();
    projectRegistrationAttribute.name = dto.name;
    projectRegistrationAttribute.label = dto.label;
    projectRegistrationAttribute.type = dto.type;
    projectRegistrationAttribute.options = dto.options ?? null;
    projectRegistrationAttribute.scoring = dto.scoring ?? {};
    projectRegistrationAttribute.pattern = dto.pattern ?? null;
    projectRegistrationAttribute.editableInPortal =
      dto.editableInPortal ?? false;
    projectRegistrationAttribute.includeInTransactionExport =
      dto.includeInTransactionExport ?? false;
    projectRegistrationAttribute.duplicateCheck = dto.duplicateCheck ?? false;
    projectRegistrationAttribute.placeholder = dto.placeholder ?? null;
    projectRegistrationAttribute.isRequired = dto.isRequired ?? false;
    projectRegistrationAttribute.showInPeopleAffectedTable =
      dto.showInPeopleAffectedTable ?? false;
    return projectRegistrationAttribute;
  }

  public async updateProjectRegistrationAttribute(
    projectId: number,
    projectRegistrationAttributeName: string,
    updateProjectRegistrationAttribute: UpdateProjectRegistrationAttributeDto,
  ): Promise<ProjectRegistrationAttributeEntity> {
    const projectRegistrationAttribute =
      await this.projectRegistrationAttributeRepository.findOne({
        where: {
          name: Equal(projectRegistrationAttributeName),
          projectId: Equal(projectId),
        },
      });
    if (!projectRegistrationAttribute) {
      const errors = `No projectRegistrationAttribute found with name ${projectRegistrationAttributeName} for project ${projectId}`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    for (const attribute in updateProjectRegistrationAttribute) {
      projectRegistrationAttribute[attribute] =
        updateProjectRegistrationAttribute[attribute];
    }

    await this.projectRegistrationAttributeRepository.save(
      projectRegistrationAttribute,
    );
    return projectRegistrationAttribute;
  }

  public async deleteProjectRegistrationAttribute(
    projectId: number,
    projectRegistrationAttributeId: number,
  ): Promise<ProjectRegistrationAttributeEntity> {
    await this.findProjectOrThrow(projectId);

    const projectRegistrationAttribute =
      await this.projectRegistrationAttributeRepository.findOne({
        where: { id: Number(projectRegistrationAttributeId) },
      });
    if (!projectRegistrationAttribute) {
      const errors = `Project registration attribute with id: '${projectRegistrationAttributeId}' not found.'`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return await this.projectRegistrationAttributeRepository.remove(
      projectRegistrationAttribute,
    );
  }

  public async getAllRelationProject(
    projectId: number,
  ): Promise<RegistrationDataInfo[]> {
    const relations: RegistrationDataInfo[] = [];

    const projectRegistrationAttributes =
      await this.projectRegistrationAttributeRepository.find({
        where: { project: { id: Equal(projectId) } },
      });
    for (const attribute of projectRegistrationAttributes) {
      relations.push({
        name: attribute.name,
        type: attribute.type,
        relation: {
          projectRegistrationAttributeId: attribute.id,
        },
      });
    }

    return relations;
  }

  public async hasPersonalReadAccess(
    userId: number,
    projectId: number,
  ): Promise<boolean> {
    return await this.userService.canActivate(
      [PermissionEnum.RegistrationPersonalREAD],
      projectId,
      userId,
    );
  }

  public async getFundingWallet(projectId: number) {
    // TODO: Refactor ensure this works with the new structure of FSP configuration properties
    const projectFspConfigurations =
      await this.projectFspConfigurationRepository.getByProjectIdAndFspName({
        projectId,
        fspName: Fsps.intersolveVisa,
      });
    if (!projectFspConfigurations) {
      throw new HttpException(
        'Fsp configurations not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // add all properties to a single array
    const properties: ProjectFspConfigurationPropertyEntity[] = [];
    for (const projectFspConfiguration of projectFspConfigurations) {
      properties.push(...projectFspConfiguration.properties);
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
