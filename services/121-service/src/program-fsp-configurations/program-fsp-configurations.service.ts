import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, In, Repository } from 'typeorm';

import {
  FspConfigPropertyValueVisibility,
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsps/enums/fsp-name.enum';
import { getFspConfigurationProperties } from '@121-service/src/fsps/fsp-settings.helpers';
import { CreateProgramFspConfigurationDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration.dto';
import { CreateProgramFspConfigurationPropertyDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration-property.dto';
import { ProgramFspConfigurationPropertyResponseDto } from '@121-service/src/program-fsp-configurations/dtos/program-fsp-configuration-property-response.dto';
import { ProgramFspConfigurationResponseDto } from '@121-service/src/program-fsp-configurations/dtos/program-fsp-configuration-response.dto';
import { UpdateProgramFspConfigurationDto } from '@121-service/src/program-fsp-configurations/dtos/update-program-fsp-configuration.dto';
import { UpdateProgramFspConfigurationPropertyDto } from '@121-service/src/program-fsp-configurations/dtos/update-program-fsp-configuration-property.dto';
import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';
import { ProgramFspConfigurationPropertyEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration-property.entity';
import { ProgramFspConfigurationMapper } from '@121-service/src/program-fsp-configurations/mappers/program-fsp-configuration.mapper';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

@Injectable()
export class ProgramFspConfigurationsService {
  @InjectRepository(ProgramFspConfigurationEntity)
  private readonly programFspConfigurationRepository: Repository<ProgramFspConfigurationEntity>;
  @InjectRepository(ProgramFspConfigurationPropertyEntity)
  private readonly programFspConfigurationPropertyRepository: Repository<ProgramFspConfigurationPropertyEntity>;

  public async getByProgramId(
    programId: number,
  ): Promise<ProgramFspConfigurationResponseDto[]> {
    const programFspConfigurations =
      await this.programFspConfigurationRepository.find({
        where: { programId: Equal(programId) },
        relations: ['properties'],
      });

    return ProgramFspConfigurationMapper.mapEntitiesToDtos(
      programFspConfigurations,
    );
  }

  public async create(
    programId: number,
    programFspConfigurationDto: CreateProgramFspConfigurationDto,
  ): Promise<ProgramFspConfigurationResponseDto> {
    await this.validate(programId, programFspConfigurationDto);
    return this.createEntity(programId, programFspConfigurationDto);
  }

  private async validate(
    programId: number,
    programFspConfigurationDto: CreateProgramFspConfigurationDto,
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
        `Program Fsp with name ${programFspConfigurationDto.name} already exists`,
        HttpStatus.CONFLICT,
      );
    }

    if (programFspConfigurationDto.properties) {
      await this.validateAllowedPropertyNames({
        propertyNames: programFspConfigurationDto.properties.map((p) => p.name),
        fspName: programFspConfigurationDto.fspName,
      });
    }
  }

  private async createEntity(
    programId: number,
    programFspConfigurationDto: CreateProgramFspConfigurationDto,
  ): Promise<ProgramFspConfigurationResponseDto> {
    const newConfigEntity = ProgramFspConfigurationMapper.mapDtoToEntity(
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
    return ProgramFspConfigurationMapper.mapEntityToDto(savedEntity);
  }

  public async update(
    programId: number,
    name: string,
    updateProgramFspConfigurationDto: UpdateProgramFspConfigurationDto,
  ): Promise<ProgramFspConfigurationResponseDto> {
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
        fspName: config.fspName,
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

    return ProgramFspConfigurationMapper.mapEntityToDto(savedEntity);
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
        `Cannot delete program Fsp configuration ${name} because it is still in use by registrations with referenceIds: ${registrationReferenceIds.join(
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
    properties: CreateProgramFspConfigurationPropertyDto[];
  }): Promise<ProgramFspConfigurationPropertyResponseDto[]> {
    const config = await this.getProgramFspConfigurationOrThrow(
      programId,
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
    return ProgramFspConfigurationMapper.mapPropertyEntitiesToDtos(properties);
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
        await this.programFspConfigurationPropertyRepository.find({
          where: {
            programFspConfigurationId: Equal(configIdToCheckForDuplicates),
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
    propertyName: FspConfigurationProperties;
    property: UpdateProgramFspConfigurationPropertyDto;
  }): Promise<ProgramFspConfigurationPropertyResponseDto> {
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
      ProgramFspConfigurationMapper.mapPropertyDtoValueToEntityValue(
        property.value,
        existingProperty.name,
      );

    const savedProperty =
      await this.programFspConfigurationPropertyRepository.save(
        existingProperty,
      );

    return ProgramFspConfigurationMapper.mapPropertyEntityToDto(savedProperty);
  }

  public async deleteProperty({
    programId,
    name: name,
    propertyName,
  }: {
    programId: number;
    name: string;
    propertyName: FspConfigurationProperties;
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
    inputProperties: CreateProgramFspConfigurationPropertyDto[],
  ): Promise<ProgramFspConfigurationPropertyEntity[]> {
    const propertiesToSave =
      ProgramFspConfigurationMapper.mapPropertyDtosToEntities(
        inputProperties,
        programFspConfigurationId,
      );
    return this.programFspConfigurationPropertyRepository.save(
      propertiesToSave,
    );
  }

  private async overwriteProperties(
    programFspConfigurationId: number,
    properties: CreateProgramFspConfigurationPropertyDto[],
  ): Promise<ProgramFspConfigurationPropertyEntity[]> {
    // delete all properties
    await this.programFspConfigurationPropertyRepository.delete({
      programFspConfigurationId: Equal(programFspConfigurationId),
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
  ): Promise<ProgramFspConfigurationEntity> {
    const config = await this.programFspConfigurationRepository.findOne({
      where: {
        name: Equal(name),
        programId: Equal(programId),
      },
    });
    if (!config) {
      throw new HttpException(
        `Program Fsp configuration with name ${name} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    return config;
  }

  private async getProgramFspConfigurationPropertyOrThrow(
    programFspConfigurationId: number,
    propertyName: FspConfigurationProperties,
  ): Promise<ProgramFspConfigurationPropertyEntity> {
    const property =
      await this.programFspConfigurationPropertyRepository.findOne({
        where: {
          programFspConfigurationId: Equal(programFspConfigurationId),
          name: Equal(propertyName),
        },
      });
    if (!property) {
      throw new HttpException(
        `Program Fsp configuration property with name ${propertyName} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    return property;
  }

  public async getProgramFspProperties(
    programId: number,
    name: string,
  ): Promise<{ name: FspConfigurationProperties; value: string }[]> {
    const config = await this.getProgramFspConfigurationOrThrow(
      programId,
      name,
    );
    const allProperties =
      await this.programFspConfigurationPropertyRepository.find({
        where: { programFspConfigurationId: Equal(config.id) },
      });
    return allProperties.map((prop) => {
      const isVisible =
        FspConfigPropertyValueVisibility[
          prop.name as FspConfigurationProperties
        ];
      let value: string;
      if (isVisible) {
        value =
          typeof prop.value === 'string'
            ? prop.value
            : JSON.stringify(prop.value);
      } else {
        value = '[********]';
      }
      return {
        name: prop.name as FspConfigurationProperties,
        value,
      };
    });
  }
}
