import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, In, Repository } from 'typeorm';

import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsps/enums/fsp-name.enum';
import { getFspConfigurationProperties } from '@121-service/src/fsps/fsp-settings.helpers';
import { CreateProjectFspConfigurationDto } from '@121-service/src/project-fsp-configurations/dtos/create-project-fsp-configuration.dto';
import { CreateProjectFspConfigurationPropertyDto } from '@121-service/src/project-fsp-configurations/dtos/create-project-fsp-configuration-property.dto';
import { ProjectFspConfigurationPropertyResponseDto } from '@121-service/src/project-fsp-configurations/dtos/project-fsp-configuration-property-response.dto';
import { ProjectFspConfigurationResponseDto } from '@121-service/src/project-fsp-configurations/dtos/project-fsp-configuration-response.dto';
import { UpdateProjectFspConfigurationDto } from '@121-service/src/project-fsp-configurations/dtos/update-project-fsp-configuration.dto';
import { UpdateProjectFspConfigurationPropertyDto } from '@121-service/src/project-fsp-configurations/dtos/update-project-fsp-configuration-property.dto';
import { ProjectFspConfigurationEntity } from '@121-service/src/project-fsp-configurations/entities/project-fsp-configuration.entity';
import { ProjectFspConfigurationPropertyEntity } from '@121-service/src/project-fsp-configurations/entities/project-fsp-configuration-property.entity';
import { ProjectFspConfigurationMapper } from '@121-service/src/project-fsp-configurations/mappers/project-fsp-configuration.mapper';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

@Injectable()
export class ProjectFspConfigurationsService {
  @InjectRepository(ProjectFspConfigurationEntity)
  private readonly projectFspConfigurationRepository: Repository<ProjectFspConfigurationEntity>;
  @InjectRepository(ProjectFspConfigurationPropertyEntity)
  private readonly projectFspConfigurationPropertyRepository: Repository<ProjectFspConfigurationPropertyEntity>;

  public async getByProjectId(
    projectId: number,
  ): Promise<ProjectFspConfigurationResponseDto[]> {
    const projectFspConfigurations =
      await this.projectFspConfigurationRepository.find({
        where: { projectId: Equal(projectId) },
        relations: ['properties'],
      });

    return ProjectFspConfigurationMapper.mapEntitiesToDtos(
      projectFspConfigurations,
    );
  }

  public async create(
    projectId: number,
    projectFspConfigurationDto: CreateProjectFspConfigurationDto,
  ): Promise<ProjectFspConfigurationResponseDto> {
    await this.validate(projectId, projectFspConfigurationDto);
    return this.createEntity(projectId, projectFspConfigurationDto);
  }

  private async validate(
    projectId: number,
    projectFspConfigurationDto: CreateProjectFspConfigurationDto,
  ): Promise<void> {
    this.validateLabelHasEnglishTranslation(projectFspConfigurationDto.label);

    const existingConfig = await this.projectFspConfigurationRepository.findOne(
      {
        where: {
          name: Equal(projectFspConfigurationDto.name),
          projectId: Equal(projectId),
        },
      },
    );

    if (existingConfig) {
      throw new HttpException(
        `Project Fsp with name ${projectFspConfigurationDto.name} already exists`,
        HttpStatus.CONFLICT,
      );
    }

    if (projectFspConfigurationDto.properties) {
      await this.validateAllowedPropertyNames({
        propertyNames: projectFspConfigurationDto.properties.map((p) => p.name),
        fspName: projectFspConfigurationDto.fspName,
      });
    }
  }

  private async createEntity(
    projectId: number,
    projectFspConfigurationDto: CreateProjectFspConfigurationDto,
  ): Promise<ProjectFspConfigurationResponseDto> {
    const newConfigEntity = ProjectFspConfigurationMapper.mapDtoToEntity(
      projectFspConfigurationDto,
      projectId,
    );
    const savedEntity =
      await this.projectFspConfigurationRepository.save(newConfigEntity);
    if (projectFspConfigurationDto.properties) {
      savedEntity.properties = await this.createPropertyEntities(
        savedEntity.id,
        projectFspConfigurationDto.properties,
      );
    }
    return ProjectFspConfigurationMapper.mapEntityToDto(savedEntity);
  }

  public async update(
    projectId: number,
    name: string,
    updateProjectFspConfigurationDto: UpdateProjectFspConfigurationDto,
  ): Promise<ProjectFspConfigurationResponseDto> {
    const config = await this.projectFspConfigurationRepository.findOne({
      where: {
        name: Equal(name),
        projectId: Equal(projectId),
      },
    });

    if (!config) {
      throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    }

    // Only update the label an properties in this API call. I cannot imagine a use case where we would want to update the name or fsp name
    // Updating the FSP name would also be more complex as you would need to check if the new properties are valid for the new FSP
    this.validateLabelHasEnglishTranslation(
      updateProjectFspConfigurationDto.label,
    );
    config.label = updateProjectFspConfigurationDto.label;

    if (updateProjectFspConfigurationDto.properties) {
      await this.validateAllowedPropertyNames({
        propertyNames: updateProjectFspConfigurationDto.properties.map(
          (p) => p.name,
        ),
        fspName: config.fspName,
      });
    }

    const savedEntity =
      await this.projectFspConfigurationRepository.save(config);

    if (updateProjectFspConfigurationDto.properties) {
      savedEntity.properties = await this.overwriteProperties(
        savedEntity.id,
        updateProjectFspConfigurationDto.properties,
      );
    }

    return ProjectFspConfigurationMapper.mapEntityToDto(savedEntity);
  }

  public async delete(projectId: number, name: string): Promise<void> {
    const config = await this.projectFspConfigurationRepository.findOne({
      where: {
        name: Equal(name),
        projectId: Equal(projectId),
      },
      relations: ['registrations'], //TODO: Should this module know about registrations?
    });
    if (!config) {
      throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    }

    const activeRegistrationsWithFspConfig = config.registrations.filter(
      (r) => r.registrationStatus !== RegistrationStatusEnum.deleted,
    );
    if (activeRegistrationsWithFspConfig.length > 0) {
      const registrationReferenceIds = activeRegistrationsWithFspConfig.map(
        (r) => r.referenceId,
      );
      throw new HttpException(
        `Cannot delete project Fsp configuration ${name} because it is still in use by registrations with referenceIds: ${registrationReferenceIds.join(
          ', ',
        )}`,
        HttpStatus.CONFLICT,
      );
    }

    // projectFspConfigProperties are cascade-deleted, transactions/registrations are kept but FK set to null
    await this.projectFspConfigurationRepository.delete({
      id: config.id,
    });
  }

  public async createProperties({
    projectId,
    name,
    properties: inputProperties,
  }: {
    projectId: number;
    name: string;
    properties: CreateProjectFspConfigurationPropertyDto[];
  }): Promise<ProjectFspConfigurationPropertyResponseDto[]> {
    const config = await this.getProjectFspConfigurationOrThrow(
      projectId,
      name,
    );
    await this.validateAllowedPropertyNames({
      propertyNames: inputProperties.map((p) => p.name),
      fspName: config.fspName,
    });
    await this.validateNoDuplicateExistingProperties({
      propertyNames: inputProperties.map((p) => p.name),
      configIdToCheckForDuplicates: config.id,
    });
    const properties = await this.createPropertyEntities(
      config.id,
      inputProperties,
    );
    return ProjectFspConfigurationMapper.mapPropertyEntitiesToDtos(properties);
  }

  private async validateAllowedPropertyNames({
    propertyNames,
    fspName,
  }: {
    propertyNames: string[];
    fspName: Fsps;
  }): Promise<void> {
    const configPropertiesOfFsp = getFspConfigurationProperties(fspName);

    const errors: string[] = [];
    for (const propertyName of propertyNames) {
      if (
        configPropertiesOfFsp &&
        !configPropertiesOfFsp.includes(propertyName)
      ) {
        errors.push(
          `For fsp ${fspName}, only the following values are allowed: ${configPropertiesOfFsp.join(' ')}. You tried to add ${propertyName}.`,
        );
      }
    }

    // Check if there are duplicate property names in this array
    if (propertyNames.length !== new Set(propertyNames).size) {
      const duplicateNames = propertyNames.filter(
        (name, index) => propertyNames.indexOf(name) !== index,
      );
      errors.push(
        `Duplicate property names are not allowed. Found the following duplicates: ${duplicateNames.join(', ')}`,
      );
    }

    if (errors.length > 0) {
      const errorsString = errors.join(' ');
      throw new HttpException(errorsString, HttpStatus.BAD_REQUEST);
    }
  }

  private async validateNoDuplicateExistingProperties({
    propertyNames,
    configIdToCheckForDuplicates,
  }: {
    propertyNames: string[];
    configIdToCheckForDuplicates: number;
  }): Promise<void> {
    // Check if properties are already present in the database
    const errors: string[] = [];
    if (configIdToCheckForDuplicates) {
      const exisingProperties =
        await this.projectFspConfigurationPropertyRepository.find({
          where: {
            projectFspConfigurationId: Equal(configIdToCheckForDuplicates),
            name: In(propertyNames),
          },
        });
      for (const property of exisingProperties) {
        errors.push(
          `Property with name ${property.name} already exists for this configuration`,
        );
      }
    }
    if (errors.length > 0) {
      const errorsString = errors.join(' ');
      throw new HttpException(errorsString, HttpStatus.BAD_REQUEST);
    }
  }

  public async updateProperty({
    projectId,
    name: name,
    propertyName,
    property,
  }: {
    projectId: number;
    name: string;
    propertyName: FspConfigurationProperties;
    property: UpdateProjectFspConfigurationPropertyDto;
  }): Promise<ProjectFspConfigurationPropertyResponseDto> {
    const config = await this.getProjectFspConfigurationOrThrow(
      projectId,
      name,
    );
    const existingProperty =
      await this.getProjectFspConfigurationPropertyOrThrow(
        config.id,
        propertyName,
      );

    existingProperty.value =
      ProjectFspConfigurationMapper.mapPropertyDtoValueToEntityValue(
        property.value,
        existingProperty.name,
      );

    const savedProperty =
      await this.projectFspConfigurationPropertyRepository.save(
        existingProperty,
      );

    return ProjectFspConfigurationMapper.mapPropertyEntityToDto(savedProperty);
  }

  public async deleteProperty({
    projectId,
    name: name,
    propertyName,
  }: {
    projectId: number;
    name: string;
    propertyName: FspConfigurationProperties;
  }): Promise<void> {
    const config = await this.getProjectFspConfigurationOrThrow(
      projectId,
      name,
    );
    const existingProperty =
      await this.getProjectFspConfigurationPropertyOrThrow(
        config.id,
        propertyName,
      );
    await this.projectFspConfigurationPropertyRepository.delete({
      id: existingProperty.id,
    });
  }

  private async createPropertyEntities(
    projectFspConfigurationId: number,
    inputProperties: CreateProjectFspConfigurationPropertyDto[],
  ): Promise<ProjectFspConfigurationPropertyEntity[]> {
    const propertiesToSave =
      ProjectFspConfigurationMapper.mapPropertyDtosToEntities(
        inputProperties,
        projectFspConfigurationId,
      );
    return this.projectFspConfigurationPropertyRepository.save(
      propertiesToSave,
    );
  }

  private async overwriteProperties(
    projectFspConfigurationId: number,
    properties: CreateProjectFspConfigurationPropertyDto[],
  ): Promise<ProjectFspConfigurationPropertyEntity[]> {
    // delete all properties
    await this.projectFspConfigurationPropertyRepository.delete({
      projectFspConfigurationId: Equal(projectFspConfigurationId),
    });
    // create new properties
    return await this.createPropertyEntities(
      projectFspConfigurationId,
      properties,
    );
  }

  private validateLabelHasEnglishTranslation(label: any): void {
    if (!label.en) {
      throw new HttpException(
        `Label must have an English translation`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async getProjectFspConfigurationOrThrow(
    projectId: number,
    name: string,
  ): Promise<ProjectFspConfigurationEntity> {
    const config = await this.projectFspConfigurationRepository.findOne({
      where: {
        name: Equal(name),
        projectId: Equal(projectId),
      },
    });
    if (!config) {
      throw new HttpException(
        `Project Fsp configuration with name ${name} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    return config;
  }

  private async getProjectFspConfigurationPropertyOrThrow(
    projectFspConfigurationId: number,
    propertyName: FspConfigurationProperties,
  ): Promise<ProjectFspConfigurationPropertyEntity> {
    const property =
      await this.projectFspConfigurationPropertyRepository.findOne({
        where: {
          projectFspConfigurationId: Equal(projectFspConfigurationId),
          name: Equal(propertyName),
        },
      });
    if (!property) {
      throw new HttpException(
        `Project Fsp configuration property with name ${propertyName} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    return property;
  }

  public async getFspConfigurationProperties(
    projectId: number,
    name: string,
  ): Promise<ProjectFspConfigurationPropertyResponseDto[]> {
    const config = await this.getProjectFspConfigurationOrThrow(
      projectId,
      name,
    );
    const allProperties =
      await this.projectFspConfigurationPropertyRepository.find({
        where: { projectFspConfigurationId: Equal(config.id) },
      });
    return ProjectFspConfigurationMapper.mapPropertyEntitiesToDtos(
      allProperties,
    );
  }
}
