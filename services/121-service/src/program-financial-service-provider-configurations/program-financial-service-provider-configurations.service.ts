import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, In, Repository } from 'typeorm';

import {
  FinancialServiceProviderConfigurationProperties,
  FinancialServiceProviders,
} from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { FINANCIAL_SERVICE_PROVIDERS } from '@121-service/src/financial-service-providers/financial-service-providers.const';
import { findConfigurationProperties } from '@121-service/src/financial-service-providers/financial-service-providers.helpers';
import { CreateProgramFinancialServiceProviderConfigurationDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/create-program-financial-service-provider-configuration.dto';
import { CreateProgramFinancialServiceProviderConfigurationPropertyDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/create-program-financial-service-provider-configuration-property.dto';
import { ProgramFinancialServiceProviderConfigurationPropertyResponseDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/program-financial-service-provider-configuration-property-response.dto';
import { ProgramFinancialServiceProviderConfigurationResponseDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/program-financial-service-provider-configuration-response.dto';
import { UpdateProgramFinancialServiceProviderConfigurationDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/update-program-financial-service-provider-configuration.dto';
import { UpdateProgramFinancialServiceProviderConfigurationPropertyDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/update-program-financial-service-provider-configuration-property.dto';
import { ProgramFinancialServiceProviderConfigurationEntity } from '@121-service/src/program-financial-service-provider-configurations/entities/program-financial-service-provider-configuration.entity';
import { ProgramFinancialServiceProviderConfigurationPropertyEntity } from '@121-service/src/program-financial-service-provider-configurations/entities/program-financial-service-provider-configuration-property.entity';
import { ProgramFinancialServiceProviderConfigurationMapper } from '@121-service/src/program-financial-service-provider-configurations/mappers/program-financial-service-provider-configuration.mapper';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';

@Injectable()
export class ProgramFinancialServiceProviderConfigurationsService {
  @InjectRepository(ProgramFinancialServiceProviderConfigurationEntity)
  private readonly programFspConfigurationRepository: Repository<ProgramFinancialServiceProviderConfigurationEntity>;
  @InjectRepository(ProgramFinancialServiceProviderConfigurationPropertyEntity)
  private readonly programFspConfigurationPropertyRepository: Repository<ProgramFinancialServiceProviderConfigurationPropertyEntity>;
  @InjectRepository(ProgramEntity)
  private readonly programRepository: ProgramRepository;

  public async findByProgramId(
    programId: number,
  ): Promise<ProgramFinancialServiceProviderConfigurationResponseDto[]> {
    await this.validateProgramExists(programId);

    const programFspConfigurations =
      await this.programFspConfigurationRepository.find({
        where: { programId: Equal(programId) },
        relations: ['properties'],
      });

    return ProgramFinancialServiceProviderConfigurationMapper.mapEntitiesToDtos(
      programFspConfigurations,
    );
  }

  public async validateAndCreate(
    programId: number,
    programFspConfigurationDto: CreateProgramFinancialServiceProviderConfigurationDto,
  ): Promise<ProgramFinancialServiceProviderConfigurationResponseDto> {
    await this.validate(programId, programFspConfigurationDto);
    return this.create(programId, programFspConfigurationDto);
  }

  private async validate(
    programId: number,
    programFspConfigurationDto: CreateProgramFinancialServiceProviderConfigurationDto,
  ): Promise<void> {
    await this.validateProgramExists(programId);
    this.validateFspExists(
      programFspConfigurationDto.financialServiceProviderName,
    );
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
      // Should we use http status code conflict here or is that code too obscure
      throw new HttpException(
        `Program Financial Service Provider with name ${programFspConfigurationDto.name} already exists`,
        HttpStatus.CONFLICT,
      );
    }

    if (programFspConfigurationDto.properties) {
      await this.validateAllowedPropertyNames({
        properties: programFspConfigurationDto.properties,
        financialServiceProviderName:
          programFspConfigurationDto.financialServiceProviderName,
      });
    }
  }

  private async create(
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
      savedEntity.properties = await this.createProperties(
        savedEntity.id,
        programFspConfigurationDto.properties,
      );
    }
    return ProgramFinancialServiceProviderConfigurationMapper.mapEntitytoDto(
      savedEntity,
    );
  }

  public async update(
    programId: number,
    programFspConfigurationName: string,
    updateProgramFspConfigurationDto: UpdateProgramFinancialServiceProviderConfigurationDto,
  ): Promise<ProgramFinancialServiceProviderConfigurationResponseDto> {
    await this.validateProgramExists(programId);
    const config = await this.programFspConfigurationRepository.findOne({
      where: {
        name: Equal(programFspConfigurationName),
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
        properties: updateProgramFspConfigurationDto.properties,
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

    return ProgramFinancialServiceProviderConfigurationMapper.mapEntitytoDto(
      savedEntity,
    );
  }

  public async delete(
    programId: number,
    programFspConfigurationName: string,
  ): Promise<void> {
    await this.validateProgramExists(programId);
    const config = await this.programFspConfigurationRepository.findOne({
      where: {
        name: Equal(programFspConfigurationName),
        programId: Equal(programId),
      },
      relations: ['properties'],
    });

    if (!config) {
      throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    }

    // Should I import the transaction repository here or is this better for the single responsibility principle
    const configCountIfItHasTransactions =
      await this.programFspConfigurationRepository
        .createQueryBuilder('config')
        .innerJoin('config.transactions', 'transaction')
        .where('config.id = :id', { id: config.id })
        .getCount();
    if (configCountIfItHasTransactions > 0) {
      throw new HttpException(
        'Cannot delete program fsp configuration with transactions as this is needed for reporting',
        HttpStatus.CONFLICT,
      );
    }

    // Should cascade delete the properties
    await this.programFspConfigurationRepository.delete({
      id: config.id,
    });
  }

  public async validateAndCreateProperties({
    programId,
    programFspConfigurationName,
    properties: inputProperties,
  }: {
    programId: number;
    programFspConfigurationName: string;
    properties: CreateProgramFinancialServiceProviderConfigurationPropertyDto[];
  }): Promise<
    ProgramFinancialServiceProviderConfigurationPropertyResponseDto[]
  > {
    await this.validateProgramExists(programId);
    const config = await this.getProgramFspConfigurationOrThrow(
      programId,
      programFspConfigurationName,
    );
    await this.validateAllowedPropertyNames({
      properties: inputProperties,
      financialServiceProviderName: config.financialServiceProviderName,
      configIdToCheckForDuplicates: config.id,
    });
    const properties = await this.createProperties(config.id, inputProperties);
    return ProgramFinancialServiceProviderConfigurationMapper.mapPropertyEntitiesToDtos(
      properties,
    );
  }

  private async validateAllowedPropertyNames({
    properties,
    financialServiceProviderName,
    configIdToCheckForDuplicates,
  }: {
    properties: CreateProgramFinancialServiceProviderConfigurationPropertyDto[];
    financialServiceProviderName: FinancialServiceProviders;
    configIdToCheckForDuplicates?: number;
  }): Promise<void> {
    const configPropertiesOfFsp = findConfigurationProperties(
      financialServiceProviderName,
    );

    const errors: string[] = [];
    for (const programFspConfigurationDto of properties) {
      if (
        configPropertiesOfFsp &&
        !configPropertiesOfFsp.includes(programFspConfigurationDto.name)
      ) {
        errors.push(
          `For fsp ${financialServiceProviderName}, only the following values are allowed: ${configPropertiesOfFsp.join(' ')}. You tried to add ${programFspConfigurationDto.name}.`,
        );
      }
    }

    // Check if there are duplicate property names in this array
    const propertyNames = properties.map((property) => property.name);
    if (propertyNames.length !== new Set(propertyNames).size) {
      const duplicateNames = propertyNames.filter(
        (name, index) => propertyNames.indexOf(name) !== index,
      );
      errors.push(
        `Duplicate property names are not allowed. Found the following duplicates: ${duplicateNames.join(', ')}`,
      );
    }

    // Check if properties are already present in the database
    if (configIdToCheckForDuplicates) {
      const exisingProperties =
        await this.programFspConfigurationPropertyRepository.find({
          where: {
            programFinancialServiceProviderConfigurationId: Equal(
              configIdToCheckForDuplicates,
            ),
            name: In(properties.map((property) => property.name)),
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
    programFspConfigurationName,
    propertyName,
    property,
  }: {
    programId: number;
    programFspConfigurationName: string;
    propertyName: FinancialServiceProviderConfigurationProperties;
    property: UpdateProgramFinancialServiceProviderConfigurationPropertyDto;
  }): Promise<ProgramFinancialServiceProviderConfigurationPropertyResponseDto> {
    // Find the configuration
    await this.validateProgramExists(programId);
    const config = await this.getProgramFspConfigurationOrThrow(
      programId,
      programFspConfigurationName,
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
    programFspConfigurationName,
    propertyName,
  }: {
    programId: number;
    programFspConfigurationName: string;
    propertyName: FinancialServiceProviderConfigurationProperties;
  }): Promise<void> {
    await this.validateProgramExists(programId);
    const config = await this.getProgramFspConfigurationOrThrow(
      programId,
      programFspConfigurationName,
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

  private async createProperties(
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
    return await this.createProperties(programFspConfigurationId, properties);
  }

  // ##TODO: We call this now at the start of each function. Should we move this to a middleware or something else?
  // Or think about refactoring this in some other way? Or leave this out of scope for now
  // I do think this error is useful for the user, but it is a bit repetitive
  private async validateProgramExists(programId: number): Promise<void> {
    const program = await this.programRepository.findOneBy({ id: programId });
    if (!program) {
      throw new HttpException(
        `Program with id ${programId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  private validateFspExists(fspName: string): void {
    const fsp = FINANCIAL_SERVICE_PROVIDERS.find((fsp) => fsp.name === fspName);
    if (!fsp) {
      throw new HttpException(
        `No fsp found with name ${fspName}`,
        HttpStatus.NOT_FOUND,
      );
    }
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
    programFspConfigurationName: string,
  ): Promise<ProgramFinancialServiceProviderConfigurationEntity> {
    const config = await this.programFspConfigurationRepository.findOne({
      where: {
        name: Equal(programFspConfigurationName),
        programId: Equal(programId),
      },
    });
    if (!config) {
      throw new HttpException(
        `Program financial service provider configuration with name ${programFspConfigurationName} not found`,
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
