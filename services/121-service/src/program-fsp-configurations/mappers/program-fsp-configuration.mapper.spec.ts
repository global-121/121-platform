import { FSP_SETTINGS } from '@121-service/src/fsp-integrations/settings/fsp-settings.const';
import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { CreateProgramFspConfigurationDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration.dto';
import { CreateProgramFspConfigurationPropertyDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration-property.dto';
import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';
import { ProgramFspConfigurationPropertyEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration-property.entity';
import { ProgramFspConfigurationMapper } from '@121-service/src/program-fsp-configurations/mappers/program-fsp-configuration.mapper';

describe('ProgramFspConfigurationMapper', () => {
  describe('mapEntitytoDto', () => {
    it('should correctly map ProgramFspConfigurationEntity to ProgramFspConfigurationResponseDto', () => {
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
      const result = ProgramFspConfigurationMapper.mapEntityToDto(testEntity);

      // Assert
      expect(result.programId).toBe(testEntity.programId);
      expect(result.fspName).toBe(testEntity.fspName);
      expect(result.name).toBe(testEntity.name);
      expect(result.label).toEqual(testEntity.label);

      const expectedFsp = FSP_SETTINGS[testEntity.fspName];
      // Remove unnecessary properties from the fsp object
      const {
        configurationProperties: _configurationProperties,
        defaultLabel: _defaultLabel,
        ...expectedFspWithoutProps
      } = expectedFsp;

      // Now use expectedFspWithoutProps in your test
      expect(result.fsp).toEqual(expectedFspWithoutProps);

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
      const result = ProgramFspConfigurationMapper.mapEntityToDto(testEntity);

      // Assert
      expect(result.programId).toBe(testEntity.programId);
      expect(result.fspName).toBe(testEntity.fspName);
      expect(result.name).toBe(testEntity.name);
      expect(result.label).toEqual(testEntity.label);
      const expectedFsp = FSP_SETTINGS[testEntity.fspName];
      // Remove unnecessary properties from the fsp object
      const {
        configurationProperties: _configurationProperties,
        defaultLabel: _defaultLabel,
        ...expectedFspWithoutProps
      } = expectedFsp;
      expect(result.fsp).toEqual(expectedFspWithoutProps);
      expect(result.properties).toEqual([]);
    });
  });

  describe('mapDtoToEntity', () => {
    it('should correctly map CreateProgramFspConfigurationDto to ProgramFspConfigurationEntity', () => {
      // Arrange
      const programId = 1;
      const dto: CreateProgramFspConfigurationDto = {
        fspName: Fsps.intersolveVisa,
        name: 'Intersolve Visa in program 1',
        label: { en: 'Visa Debit Card' },
      };

      // Act
      const entity = ProgramFspConfigurationMapper.mapDtoToEntity(
        dto,
        programId,
      );

      // Assert
      expect(entity.programId).toBe(programId);
      expect(entity.fspName).toBe(dto.fspName);
      expect(entity.name).toBe(dto.name);
      expect(entity.label).toEqual(dto.label);
    });
  });

  describe('mapPropertyDtoToEntities', () => {
    it('should correctly map CreateProgramFspConfigurationPropertyDto to ProgramFspConfigurationPropertyEntity', () => {
      // Arrange
      const dto: CreateProgramFspConfigurationPropertyDto = {
        name: FspConfigurationProperties.brandCode,
        value: 'brand123',
      };
      const programFspConfigurationId = 1;

      // Act
      const entities = ProgramFspConfigurationMapper.mapPropertyDtosToEntities(
        [dto],
        programFspConfigurationId,
      );
      const entity = entities[0];
      // Assert
      expect(entity.name).toBe(dto.name);
      expect(entity.programFspConfigurationId).toBe(programFspConfigurationId);
      expect(entity.value).toBe(dto.value);
    });

    it('should correctly handle columnsToExport as an array and convert to JSON string', () => {
      // Arrange
      const dto: CreateProgramFspConfigurationPropertyDto = {
        name: FspConfigurationProperties.columnsToExport,
        value: ['column1', 'column2', 'column3'],
      };
      const programFspConfigurationId = 2;

      // Act
      const entities = ProgramFspConfigurationMapper.mapPropertyDtosToEntities(
        [dto],
        programFspConfigurationId,
      );
      const entity = entities[0];

      // Assert
      expect(entity.name).toBe(dto.name);
      expect(entity.programFspConfigurationId).toBe(programFspConfigurationId);
      expect(entity.value).toBe(JSON.stringify(dto.value)); // Expect value to be JSON string
    });
  });
});
