import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, In, Repository } from 'typeorm';

import {
  FinancialServiceProviderConfigurationProperties,
  FinancialServiceProviders,
} from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { getFinancialServiceProviderConfigurationProperties } from '@121-service/src/financial-service-providers/financial-service-provider-settings.helpers';
import { CreateProgramFinancialServiceProviderConfigurationDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/create-program-financial-service-provider-configuration.dto';
import { CreateProgramFinancialServiceProviderConfigurationPropertyDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/create-program-financial-service-provider-configuration-property.dto';
import { ProgramFinancialServiceProviderConfigurationPropertyResponseDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/program-financial-service-provider-configuration-property-response.dto';
import { ProgramFinancialServiceProviderConfigurationResponseDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/program-financial-service-provider-configuration-response.dto';
import { UpdateProgramFinancialServiceProviderConfigurationDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/update-program-financial-service-provider-configuration.dto';
import { UpdateProgramFinancialServiceProviderConfigurationPropertyDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/update-program-financial-service-provider-configuration-property.dto';
import { ProgramFinancialServiceProviderConfigurationEntity } from '@121-service/src/program-financial-service-provider-configurations/entities/program-financial-service-provider-configuration.entity';
import { ProgramFinancialServiceProviderConfigurationPropertyEntity } from '@121-service/src/program-financial-service-provider-configurations/entities/program-financial-service-provider-configuration-property.entity';
import { ProgramFinancialServiceProviderConfigurationMapper } from '@121-service/src/program-financial-service-provider-configurations/mappers/program-financial-service-provider-configuration.mapper';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

@Injectable()
export class ProgramFinancialServiceProviderConfigurationsService {
  @InjectRepository(ProgramFinancialServiceProviderConfigurationEntity)
  private readonly programFspConfigurationRepository: Repository<ProgramFinancialServiceProviderConfigurationEntity>;
  @InjectRepository(ProgramFinancialServiceProviderConfigurationPropertyEntity)
  private readonly programFspConfigurationPropertyRepository: Repository<ProgramFinancialServiceProviderConfigurationPropertyEntity>;

  public async getByProgramId(
    programId: number,
  ): Promise<ProgramFinancialServiceProviderConfigurationResponseDto[]> {
    const programFspConfigurations =
      await this.programFspConfigurationRepository.find({
        where: { programId: Equal(programId) },
        relations: ['properties'],
      });

    return ProgramFinancialServiceProviderConfigurationMapper.mapEntitiesToDtos(
      programFspConfigurations,
    );
  }

  public async create(
    programId: number,
    programFspConfigurationDto: CreateProgramFinancialServiceProviderConfigurationDto,
  ): Promise<ProgramFinancialServiceProviderConfigurationResponseDto> {
    await this.validate(programId, programFspConfigurationDto);
    return this.createEntity(programId, programFspConfigurationDto);
  }

  private async validate(
    programId: number,
    programFspConfigurationDto: CreateProgramFinancialServiceProviderConfigurationDto,
  ): Promise<void> {
    this.validateLabelHasEnglishTranslation(programFspConfigurationDto.label);

    const existingConfig = await this.programFspConfigurationRepository.findOne(
      {
        where: {
          name: Equal(programFspConfigurationDto.name),
          programId: Equal(programId),
        },
      },
    );

    if (existingConfig) {
      throw new HttpException(
        `Program Financial Service Provider with name ${programFspConfigurationDto.name} already exists`,
        HttpStatus.CONFLICT,
      );
    }

    if (programFspConfigurationDto.properties) {
      await this.validateAllowedPropertyNames({
        propertyNames: programFspConfigurationDto.properties.map((p) => p.name),
        financialServiceProviderName:
          programFspConfigurationDto.financialServiceProviderName,
      });
    }
  }

  private async createEntity(
    programId: number,
    programFspConfigurationDto: CreateProgramFinancialServiceProviderConfigurationDto,
  ): Promise<ProgramFinancialServiceProviderConfigurationResponseDto> {
    const newConfigEntity =
      ProgramFinancialServiceProviderConfigurationMapper.mapDtoToEntity(
        programFspConfigurationDto,
        programId,
      );
    const savedEntity =
      await this.programFspConfigurationRepository.save(newConfigEntity);
    if (programFspConfigurationDto.properties) {
      savedEntity.properties = await this.createPropertyEntities(
        savedEntity.id,
        programFspConfigurationDto.properties,
      );
    }
    return ProgramFinancialServiceProviderConfigurationMapper.mapEntityToDto(
      savedEntity,
    );
  }

  public async update(
    programId: number,
    name: string,
    updateProgramFspConfigurationDto: UpdateProgramFinancialServiceProviderConfigurationDto,
  ): Promise<ProgramFinancialServiceProviderConfigurationResponseDto> {
    const config = await this.programFspConfigurationRepository.findOne({
      where: {
        name: Equal(name),
        programId: Equal(programId),
      },
    });

    if (!config) {
      throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    }

    // Only update the label an properties in this API call. I cannot imagine a use case where we would want to update the name or fsp name
    // Updating the FSP name would also be more complex as you would need to check if the new properties are valid for the new FSP
    this.validateLabelHasEnglishTranslation(
      updateProgramFspConfigurationDto.label,
    );
    config.label = updateProgramFspConfigurationDto.label;

    if (updateProgramFspConfigurationDto.properties) {
      await this.validateAllowedPropertyNames({
        propertyNames: updateProgramFspConfigurationDto.properties.map(
          (p) => p.name,
        ),
        financialServiceProviderName: config.financialServiceProviderName,
      });
    }

    const savedEntity =
      await this.programFspConfigurationRepository.save(config);

    if (updateProgramFspConfigurationDto.properties) {
      savedEntity.properties = await this.overwriteProperties(
        savedEntity.id,
        updateProgramFspConfigurationDto.properties,
      );
    }

    return ProgramFinancialServiceProviderConfigurationMapper.mapEntityToDto(
      savedEntity,
    );
  }

  public async delete(programId: number, name: string): Promise<void> {
    const config = await this.programFspConfigurationRepository.findOne({
      where: {
        name: Equal(name),
        programId: Equal(programId),
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
        `Cannot delete program financial service provider configuration ${name} because it is still in use by registrations with referenceIds: ${registrationReferenceIds.join(
          ', ',
        )}`,
        HttpStatus.CONFLICT,
      );
    }

    // programFspConfigProperties are cascade-deleted, transactions/registrations are kept but FK set to null
    await this.programFspConfigurationRepository.delete({
      id: config.id,
    });
  }

  public async createProperties({
    programId,
    name,
    properties: inputProperties,
  }: {
    programId: number;
    name: string;
    properties: CreateProgramFinancialServiceProviderConfigurationPropertyDto[];
  }): Promise<
    ProgramFinancialServiceProviderConfigurationPropertyResponseDto[]
  > {
    const config = await this.getProgramFspConfigurationOrThrow(
      programId,
      name,
    );
    await this.validateAllowedPropertyNames({
      propertyNames: inputProperties.map((p) => p.name),
      financialServiceProviderName: config.financialServiceProviderName,
    });
    await this.validateNoDuplicateExistingProperties({
      propertyNames: inputProperties.map((p) => p.name),
      configIdToCheckForDuplicates: config.id,
    });
    const properties = await this.createPropertyEntities(
      config.id,
      inputProperties,
    );
    return ProgramFinancialServiceProviderConfigurationMapper.mapPropertyEntitiesToDtos(
      properties,
    );
  }

  private async validateAllowedPropertyNames({
    propertyNames,
    financialServiceProviderName,
  }: {
    propertyNames: string[];
    financialServiceProviderName: FinancialServiceProviders;
  }): Promise<void> {
    const configPropertiesOfFsp =
      getFinancialServiceProviderConfigurationProperties(
        financialServiceProviderName,
      );

    const errors: string[] = [];
    for (const propertyName of propertyNames) {
      if (
        configPropertiesOfFsp &&
        !configPropertiesOfFsp.includes(propertyName)
      ) {
        errors.push(
          `For fsp ${financialServiceProviderName}, only the following values are allowed: ${configPropertiesOfFsp.join(' ')}. You tried to add ${propertyName}.`,
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
        await this.programFspConfigurationPropertyRepository.find({
          where: {
            programFinancialServiceProviderConfigurationId: Equal(
              configIdToCheckForDuplicates,
            ),
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
    programId,
    name: name,
    propertyName,
    property,
  }: {
    programId: number;
    name: string;
    propertyName: FinancialServiceProviderConfigurationProperties;
    property: UpdateProgramFinancialServiceProviderConfigurationPropertyDto;
  }): Promise<ProgramFinancialServiceProviderConfigurationPropertyResponseDto> {
    const config = await this.getProgramFspConfigurationOrThrow(
      programId,
      name,
    );
    const existingProperty =
      await this.getProgramFspConfigurationPropertyOrThrow(
        config.id,
        propertyName,
      );

    existingProperty.value =
      ProgramFinancialServiceProviderConfigurationMapper.mapPropertyDtoValueToEntityValue(
        property.value,
        existingProperty.name,
      );

    const savedProperty =
      await this.programFspConfigurationPropertyRepository.save(
        existingProperty,
      );

    return ProgramFinancialServiceProviderConfigurationMapper.mapPropertyEntityToDto(
      savedProperty,
    );
  }

  public async deleteProperty({
    programId,
    name: name,
    propertyName,
  }: {
    programId: number;
    name: string;
    propertyName: FinancialServiceProviderConfigurationProperties;
  }): Promise<void> {
    const config = await this.getProgramFspConfigurationOrThrow(
      programId,
      name,
    );
    const existingProperty =
      await this.getProgramFspConfigurationPropertyOrThrow(
        config.id,
        propertyName,
      );
    await this.programFspConfigurationPropertyRepository.delete({
      id: existingProperty.id,
    });
  }

  private async createPropertyEntities(
    programFspConfigurationId: number,
    inputProperties: CreateProgramFinancialServiceProviderConfigurationPropertyDto[],
  ): Promise<ProgramFinancialServiceProviderConfigurationPropertyEntity[]> {
    const propertiesToSave =
      ProgramFinancialServiceProviderConfigurationMapper.mapPropertyDtosToEntities(
        inputProperties,
        programFspConfigurationId,
      );
    return this.programFspConfigurationPropertyRepository.save(
      propertiesToSave,
    );
  }

  private async overwriteProperties(
    programFspConfigurationId: number,
    properties: CreateProgramFinancialServiceProviderConfigurationPropertyDto[],
  ): Promise<ProgramFinancialServiceProviderConfigurationPropertyEntity[]> {
    // delete all properties
    await this.programFspConfigurationPropertyRepository.delete({
      programFinancialServiceProviderConfigurationId: Equal(
        programFspConfigurationId,
      ),
    });
    // create new properties
    return await this.createPropertyEntities(
      programFspConfigurationId,
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

  private async getProgramFspConfigurationOrThrow(
    programId: number,
    name: string,
  ): Promise<ProgramFinancialServiceProviderConfigurationEntity> {
    const config = await this.programFspConfigurationRepository.findOne({
      where: {
        name: Equal(name),
        programId: Equal(programId),
      },
    });
    if (!config) {
      throw new HttpException(
        `Program financial service provider configuration with name ${name} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    return config;
  }

  private async getProgramFspConfigurationPropertyOrThrow(
    programFspConfigurationId: number,
    propertyName: FinancialServiceProviderConfigurationProperties,
  ): Promise<ProgramFinancialServiceProviderConfigurationPropertyEntity> {
    const property =
      await this.programFspConfigurationPropertyRepository.findOne({
        where: {
          programFinancialServiceProviderConfigurationId: Equal(
            programFspConfigurationId,
          ),
          name: Equal(propertyName),
        },
      });
    if (!property) {
      throw new HttpException(
        `Program financial service provider configuration property with name ${propertyName} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    return property;
  }
}
