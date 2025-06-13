import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsps/enums/fsp-name.enum';
import { FINANCIAL_SERVICE_PROVIDER_SETTINGS } from '@121-service/src/fsps/fsp-settings.const';
import { CreateProgramFinancialServiceProviderConfigurationDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration.dto';
import { CreateProgramFinancialServiceProviderConfigurationPropertyDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration-property.dto';
import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';
import { ProgramFspConfigurationPropertyEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration-property.entity';
import { ProgramFinancialServiceProviderConfigurationMapper } from '@121-service/src/program-fsp-configurations/mappers/program-fsp-configuration.mapper';

describe('ProgramFinancialServiceProviderConfigurationMapper', () => {
  describe('mapEntitytoDto', () => {
    it('should correctly map ProgramFinancialServiceProviderConfigurationEntity to ProgramFinancialServiceProviderConfigurationResponseDto', () => {
      // Arrange
      const testEntity = new ProgramFspConfigurationEntity();
      testEntity.programId = 1;
      testEntity.fspName = Fsps.intersolveVisa;
      testEntity.name = 'Intersolve Visa';
      testEntity.label = { en: 'Visa Debit Card' };
      testEntity.properties = [
        {
          name: FspConfigurationProperties.brandCode,
          updated: new Date('2023-01-01'),
        },
        {
          name: FspConfigurationProperties.coverLetterCode,
          updated: new Date('2023-02-01'),
        },
      ] as ProgramFspConfigurationPropertyEntity[];

      // Act
      const result =
        ProgramFinancialServiceProviderConfigurationMapper.mapEntityToDto(
          testEntity,
        );

      // Assert
      expect(result.programId).toBe(testEntity.programId);
      expect(result.financialServiceProviderName).toBe(testEntity.fspName);
      expect(result.name).toBe(testEntity.name);
      expect(result.label).toEqual(testEntity.label);

      const expectedFinancialServiceProvider =
        FINANCIAL_SERVICE_PROVIDER_SETTINGS.find(
          (fsp) => fsp.name === testEntity.fspName,
        )!;
      // Remove unnecessary properties from the financialServiceProvider object
      const {
        configurationProperties: _configurationProperties,
        defaultLabel: _defaultLabel,
        ...expectedFinancialServiceProviderWithoutProps
      } = expectedFinancialServiceProvider;

      // Now use expectedFinancialServiceProviderWithoutProps in your test
      expect(result.financialServiceProvider).toEqual(
        expectedFinancialServiceProviderWithoutProps,
      );

      expect(result.properties).toHaveLength(testEntity.properties.length);
      testEntity.properties.forEach((property, index) => {
        expect(result.properties[index].name).toBe(property.name);
        expect(result.properties[index].updated).toEqual(property.updated);
      });
    });

    it('should handle an entity with no properties', () => {
      // Arrange
      const testEntity = new ProgramFspConfigurationEntity();
      testEntity.programId = 1;
      testEntity.fspName = Fsps.safaricom;
      testEntity.name = 'Safaricom M-Pesa';
      testEntity.label = { en: 'Safaricom' };
      testEntity.properties = [];

      // Act
      const result =
        ProgramFinancialServiceProviderConfigurationMapper.mapEntityToDto(
          testEntity,
        );

      // Assert
      expect(result.programId).toBe(testEntity.programId);
      expect(result.financialServiceProviderName).toBe(testEntity.fspName);
      expect(result.name).toBe(testEntity.name);
      expect(result.label).toEqual(testEntity.label);
      const expectedFinancialServiceProvider =
        FINANCIAL_SERVICE_PROVIDER_SETTINGS.find(
          (fsp) => fsp.name === testEntity.fspName,
        )!;
      // Remove unnecessary properties from the financialServiceProvider object
      const {
        configurationProperties: _configurationProperties,
        defaultLabel: _defaultLabel,
        ...expectedFinancialServiceProviderWithoutProps
      } = expectedFinancialServiceProvider;
      expect(result.financialServiceProvider).toEqual(
        expectedFinancialServiceProviderWithoutProps,
      );
      expect(result.properties).toEqual([]);
    });
  });

  describe('mapDtoToEntity', () => {
    it('should correctly map CreateProgramFinancialServiceProviderConfigurationDto to ProgramFinancialServiceProviderConfigurationEntity', () => {
      // Arrange
      const programId = 1;
      const dto: CreateProgramFinancialServiceProviderConfigurationDto = {
        financialServiceProviderName: Fsps.intersolveVisa,
        name: 'Intersolve Visa in program 1',
        label: { en: 'Visa Debit Card' },
      };

      // Act
      const entity =
        ProgramFinancialServiceProviderConfigurationMapper.mapDtoToEntity(
          dto,
          programId,
        );

      // Assert
      expect(entity.programId).toBe(programId);
      expect(entity.fspName).toBe(dto.financialServiceProviderName);
      expect(entity.name).toBe(dto.name);
      expect(entity.label).toEqual(dto.label);
    });
  });

  describe('mapPropertyDtoToEntities', () => {
    it('should correctly map CreateProgramFinancialServiceProviderConfigurationPropertyDto to ProgramFinancialServiceProviderConfigurationPropertyEntity', () => {
      // Arrange
      const dto: CreateProgramFinancialServiceProviderConfigurationPropertyDto =
        {
          name: FspConfigurationProperties.brandCode,
          value: 'brand123',
        };
      const programFinancialServiceProviderConfigurationId = 1;

      // Act
      const entities =
        ProgramFinancialServiceProviderConfigurationMapper.mapPropertyDtosToEntities(
          [dto],
          programFinancialServiceProviderConfigurationId,
        );
      const entity = entities[0];
      // Assert
      expect(entity.name).toBe(dto.name);
      expect(entity.programFspConfigurationId).toBe(
        programFinancialServiceProviderConfigurationId,
      );
      expect(entity.value).toBe(dto.value);
    });

    it('should correctly handle columnsToExport as an array and convert to JSON string', () => {
      // Arrange
      const dto: CreateProgramFinancialServiceProviderConfigurationPropertyDto =
        {
          name: FspConfigurationProperties.columnsToExport,
          value: ['column1', 'column2', 'column3'],
        };
      const programFinancialServiceProviderConfigurationId = 2;

      // Act
      const entities =
        ProgramFinancialServiceProviderConfigurationMapper.mapPropertyDtosToEntities(
          [dto],
          programFinancialServiceProviderConfigurationId,
        );
      const entity = entities[0];

      // Assert
      expect(entity.name).toBe(dto.name);
      expect(entity.programFspConfigurationId).toBe(
        programFinancialServiceProviderConfigurationId,
      );
      expect(entity.value).toBe(JSON.stringify(dto.value)); // Expect value to be JSON string
    });
  });
});
