import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsps/enums/fsp-name.enum';
import { FSP_SETTINGS } from '@121-service/src/fsps/fsp-settings.const';
import { CreateProjectFspConfigurationDto } from '@121-service/src/project-fsp-configurations/dtos/create-project-fsp-configuration.dto';
import { CreateProjectFspConfigurationPropertyDto } from '@121-service/src/project-fsp-configurations/dtos/create-project-fsp-configuration-property.dto';
import { ProjectFspConfigurationEntity } from '@121-service/src/project-fsp-configurations/entities/project-fsp-configuration.entity';
import { ProjectFspConfigurationPropertyEntity } from '@121-service/src/project-fsp-configurations/entities/project-fsp-configuration-property.entity';
import { ProjectFspConfigurationMapper } from '@121-service/src/project-fsp-configurations/mappers/project-fsp-configuration.mapper';

describe('ProjectFspConfigurationMapper', () => {
  describe('mapEntitytoDto', () => {
    it('should correctly map ProjectFspConfigurationEntity to ProjectFspConfigurationResponseDto', () => {
      // Arrange
      const testEntity = new ProjectFspConfigurationEntity();
      testEntity.projectId = 1;
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
      ] as ProjectFspConfigurationPropertyEntity[];

      // Act
      const result = ProjectFspConfigurationMapper.mapEntityToDto(testEntity);

      // Assert
      expect(result.projectId).toBe(testEntity.projectId);
      expect(result.fspName).toBe(testEntity.fspName);
      expect(result.name).toBe(testEntity.name);
      expect(result.label).toEqual(testEntity.label);

      const expectedFsp = FSP_SETTINGS.find(
        (fsp) => fsp.name === testEntity.fspName,
      )!;
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
      const testEntity = new ProjectFspConfigurationEntity();
      testEntity.projectId = 1;
      testEntity.fspName = Fsps.safaricom;
      testEntity.name = 'Safaricom M-Pesa';
      testEntity.label = { en: 'Safaricom' };
      testEntity.properties = [];

      // Act
      const result = ProjectFspConfigurationMapper.mapEntityToDto(testEntity);

      // Assert
      expect(result.projectId).toBe(testEntity.projectId);
      expect(result.fspName).toBe(testEntity.fspName);
      expect(result.name).toBe(testEntity.name);
      expect(result.label).toEqual(testEntity.label);
      const expectedFsp = FSP_SETTINGS.find(
        (fsp) => fsp.name === testEntity.fspName,
      )!;
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
    it('should correctly map CreateProjectFspConfigurationDto to ProjectFspConfigurationEntity', () => {
      // Arrange
      const projectId = 1;
      const dto: CreateProjectFspConfigurationDto = {
        fspName: Fsps.intersolveVisa,
        name: 'Intersolve Visa in project 1',
        label: { en: 'Visa Debit Card' },
      };

      // Act
      const entity = ProjectFspConfigurationMapper.mapDtoToEntity(
        dto,
        projectId,
      );

      // Assert
      expect(entity.projectId).toBe(projectId);
      expect(entity.fspName).toBe(dto.fspName);
      expect(entity.name).toBe(dto.name);
      expect(entity.label).toEqual(dto.label);
    });
  });

  describe('mapPropertyDtoToEntities', () => {
    it('should correctly map CreateProjectFspConfigurationPropertyDto to ProjectFspConfigurationPropertyEntity', () => {
      // Arrange
      const dto: CreateProjectFspConfigurationPropertyDto = {
        name: FspConfigurationProperties.brandCode,
        value: 'brand123',
      };
      const projectFspConfigurationId = 1;

      // Act
      const entities = ProjectFspConfigurationMapper.mapPropertyDtosToEntities(
        [dto],
        projectFspConfigurationId,
      );
      const entity = entities[0];
      // Assert
      expect(entity.name).toBe(dto.name);
      expect(entity.projectFspConfigurationId).toBe(projectFspConfigurationId);
      expect(entity.value).toBe(dto.value);
    });

    it('should correctly handle columnsToExport as an array and convert to JSON string', () => {
      // Arrange
      const dto: CreateProjectFspConfigurationPropertyDto = {
        name: FspConfigurationProperties.columnsToExport,
        value: ['column1', 'column2', 'column3'],
      };
      const projectFspConfigurationId = 2;

      // Act
      const entities = ProjectFspConfigurationMapper.mapPropertyDtosToEntities(
        [dto],
        projectFspConfigurationId,
      );
      const entity = entities[0];

      // Assert
      expect(entity.name).toBe(dto.name);
      expect(entity.projectFspConfigurationId).toBe(projectFspConfigurationId);
      expect(entity.value).toBe(JSON.stringify(dto.value)); // Expect value to be JSON string
    });
  });
});
