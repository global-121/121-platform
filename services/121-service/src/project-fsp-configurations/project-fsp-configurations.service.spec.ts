import { HttpException, HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Equal } from 'typeorm';

import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsps/enums/fsp-name.enum';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.scoped.repository';
import { CreateProjectFspConfigurationDto } from '@121-service/src/project-fsp-configurations/dtos/create-project-fsp-configuration.dto';
import { CreateProjectFspConfigurationPropertyDto } from '@121-service/src/project-fsp-configurations/dtos/create-project-fsp-configuration-property.dto';
import { UpdateProjectFspConfigurationDto } from '@121-service/src/project-fsp-configurations/dtos/update-project-fsp-configuration.dto';
import { ProjectFspConfigurationEntity } from '@121-service/src/project-fsp-configurations/entities/project-fsp-configuration.entity';
import { ProjectFspConfigurationPropertyEntity } from '@121-service/src/project-fsp-configurations/entities/project-fsp-configuration-property.entity';
import { ProjectFspConfigurationsService } from '@121-service/src/project-fsp-configurations/project-fsp-configurations.service';

const projectId = 1;
const mockProjectFspConfigPropertyEntity =
  new ProjectFspConfigurationPropertyEntity();
mockProjectFspConfigPropertyEntity.id = 1;
mockProjectFspConfigPropertyEntity.name = FspConfigurationProperties.brandCode;
mockProjectFspConfigPropertyEntity.value = '123';
mockProjectFspConfigPropertyEntity.projectFspConfigurationId = 1;

const configName = 'Config 1';
const mockProjectFspConfigEntity = new ProjectFspConfigurationEntity();
mockProjectFspConfigEntity.id = 1;
mockProjectFspConfigEntity.name = configName;
mockProjectFspConfigEntity.projectId = 1;
mockProjectFspConfigEntity.fspName = Fsps.intersolveVisa;
mockProjectFspConfigEntity.label = { en: 'Test Label' };
mockProjectFspConfigEntity.properties = [mockProjectFspConfigPropertyEntity];
mockProjectFspConfigEntity.registrations = [];

const validPropertyDto: CreateProjectFspConfigurationPropertyDto = {
  name: FspConfigurationProperties.brandCode,
  value: '123',
};

// Declaring mocks here so they are accesble through all files
let mockProjectFspConfigurationRepository;
let mockProjectFspConfigurationPropertyRepository;
let mockTransactionScopedRepository;

describe('ProjectFspConfigurationsService', () => {
  let service: ProjectFspConfigurationsService;

  beforeEach(async () => {
    mockProjectFspConfigurationRepository = {
      find: jest.fn().mockImplementation((criteria) => {
        const projectIdOfWhere = criteria.where.projectId._value;
        const nameWhere = criteria.where?.name?._value;

        if (projectIdOfWhere === 1 && !nameWhere) {
          return [mockProjectFspConfigEntity];
        } else if (projectIdOfWhere === 1 && nameWhere === configName) {
          return [mockProjectFspConfigEntity];
        } else {
          return [];
        }
      }),
      findOne: jest.fn().mockImplementation((criteria) => {
        const projectIdOfWhere = criteria.where.projectId._value;
        const nameWhere = criteria.where?.name?._value;

        if (projectIdOfWhere === 1 && !nameWhere) {
          return mockProjectFspConfigEntity;
        } else if (projectIdOfWhere === 1 && nameWhere === configName) {
          return mockProjectFspConfigEntity;
        } else {
          return null;
        }
      }),
      save: jest.fn().mockImplementation((entity) => {
        return entity; // Return the entity it receives
      }),
      delete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      }),
    };

    mockProjectFspConfigurationPropertyRepository = {
      delete: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(mockProjectFspConfigPropertyEntity),
      save: jest.fn().mockImplementation((entity) => {
        return entity; // Return the entity it receives
      }),
    };

    mockTransactionScopedRepository = {
      count: jest.fn().mockImplementation((criteria) => {
        const projectFspConfigurationIdOfWhere =
          criteria.where.projectFspConfigurationId._value;

        if (projectFspConfigurationIdOfWhere === 1) {
          return 0;
        }
        return 1;
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ProjectFspConfigurationsService,
        {
          provide: getRepositoryToken(ProjectFspConfigurationEntity),
          useValue: mockProjectFspConfigurationRepository,
        },
        {
          provide: getRepositoryToken(ProjectFspConfigurationPropertyEntity),
          useValue: mockProjectFspConfigurationPropertyRepository,
        },
        {
          provide: TransactionScopedRepository,
          useValue: mockTransactionScopedRepository,
        },
      ],
    }).compile();

    service = moduleRef.get<ProjectFspConfigurationsService>(
      ProjectFspConfigurationsService,
    );
  });

  describe('findByProjectId', () => {
    it('should return project configurations for a given project ID', async () => {
      const result = await service.getByProjectId(projectId);

      expect(mockProjectFspConfigurationRepository.find).toHaveBeenCalledWith({
        where: { projectId: Equal(projectId) },
        relations: ['properties'],
      });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
    });
  });

  describe('validateAndCreate', () => {
    const createDto: CreateProjectFspConfigurationDto = {
      name: 'Test Configuration',
      fspName: Fsps.intersolveVisa,
      label: { en: 'Test Label' },
      properties: [
        {
          name: FspConfigurationProperties.brandCode,
          value: '123',
        },
      ],
    };

    it('should validate successfully if all checks pass', async () => {
      await expect(service.create(projectId, createDto)).resolves.not.toThrow();
      expect(
        mockProjectFspConfigurationRepository.findOne,
      ).toHaveBeenCalledWith({
        where: {
          name: Equal(createDto.name),
          projectId: Equal(projectId),
        },
      });
      expect(mockProjectFspConfigurationRepository.save).toHaveBeenCalled();
    });

    it('should throw an exception if english is not provided', async () => {
      const noEnglishLabelDto = {
        ...createDto,
        label: { fr: 'Test Label' },
      };
      await expect(
        service.create(projectId, noEnglishLabelDto),
      ).rejects.toThrow(HttpException);
      await expect(
        service.create(projectId, noEnglishLabelDto),
      ).rejects.toThrow(
        new HttpException(
          `Label must have an English translation`,
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should throw an exception if a configuration with the same name exists', async () => {
      // Mocking the check for existing configuration
      const duplivateNameCreateDto = {
        ...createDto,
        name: configName,
      };

      await expect(
        service.create(projectId, duplivateNameCreateDto),
      ).rejects.toThrow(HttpException);
      await expect(
        service.create(projectId, duplivateNameCreateDto),
      ).rejects.toThrow(
        new HttpException(
          `Project Fsp with name ${duplivateNameCreateDto.name} already exists`,
          HttpStatus.CONFLICT,
        ),
      );
    });

    it('should throw an exception if properties contain invalid name for fsp', async () => {
      const invalidPropertiesDto = {
        ...createDto,
        properties: [
          {
            name: FspConfigurationProperties.password,
            value: '123',
          },
        ],
      };
      await expect(
        service.create(projectId, invalidPropertiesDto),
      ).rejects.toThrow();
      await expect(
        service.create(projectId, invalidPropertiesDto),
      ).rejects.toThrow(new RegExp(`only the following values are allowed`));
    });

    it('should throw an exception if properties contain a duplicate name', async () => {
      const invalidPropertiesDto = {
        ...createDto,
        properties: [
          {
            name: FspConfigurationProperties.brandCode,
            value: '123',
          },
          {
            name: FspConfigurationProperties.brandCode,
            value: 'again another brandcode',
          },
        ],
      };
      await expect(
        service.create(projectId, invalidPropertiesDto),
      ).rejects.toThrow();
      await expect(
        service.create(projectId, invalidPropertiesDto),
      ).rejects.toThrow(new RegExp(`Duplicate property names are not allowed`));
    });
  });

  describe('update', () => {
    it('should successfully update the configuration', async () => {
      const updateDto: UpdateProjectFspConfigurationDto = {
        label: { en: 'Updated Label' },
        properties: [],
      };

      const result = await service.update(projectId, configName, updateDto);

      expect(
        mockProjectFspConfigurationRepository.findOne,
      ).toHaveBeenCalledWith({
        where: {
          name: Equal(configName),
          projectId: Equal(projectId),
        },
      });
      expect(
        mockProjectFspConfigurationPropertyRepository.delete,
      ).toHaveBeenCalledWith({
        projectFspConfigurationId: Equal(
          mockProjectFspConfigPropertyEntity.projectFspConfigurationId,
        ),
      });
      expect(mockProjectFspConfigurationRepository.save).toHaveBeenCalled();
      expect(result.label).toEqual(updateDto.label);
    });

    it('should throw an exception if the configuration does not exist', async () => {
      const updateDto: UpdateProjectFspConfigurationDto = {
        label: { en: 'Updated Label' },
        properties: [],
      };
      const nonExistingConfigName = 'Non existing config';

      await expect(
        service.update(projectId, nonExistingConfigName, updateDto),
      ).rejects.toThrow(HttpException);
      expect(
        mockProjectFspConfigurationPropertyRepository.delete,
      ).not.toHaveBeenCalled();
      await expect(
        service.update(projectId, nonExistingConfigName, updateDto),
      ).rejects.toThrow(new HttpException('Not found', HttpStatus.NOT_FOUND));
    });
  });

  describe('delete', () => {
    it('should successfully delete the configuration', async () => {
      await service.delete(projectId, configName);

      expect(
        mockProjectFspConfigurationRepository.findOne,
      ).toHaveBeenCalledWith({
        where: {
          name: Equal(configName),
          projectId: Equal(projectId),
        },
        relations: ['registrations'],
      });
      expect(mockProjectFspConfigurationRepository.delete).toHaveBeenCalledWith(
        {
          id: mockProjectFspConfigEntity.id,
        },
      );
    });

    it('should throw an exception if the configuration does not exist', async () => {
      // Mocking findOne to return null (configuration not found)
      const nonExistingConfigName = 'Non existing config';

      await expect(
        service.delete(projectId, nonExistingConfigName),
      ).rejects.toThrow(HttpException);
      await expect(
        service.delete(projectId, nonExistingConfigName),
      ).rejects.toThrow(new HttpException('Not found', HttpStatus.NOT_FOUND));
    });
  });

  describe('validateAndCreateProperties', () => {
    it('should succesfully map and create properties', async () => {
      const result = await service.createProperties({
        projectId,
        name: configName,
        properties: [validPropertyDto],
      });
      expect(mockProjectFspConfigurationRepository.findOne).toHaveBeenCalled();
      expect(
        mockProjectFspConfigurationPropertyRepository.save,
      ).toHaveBeenCalled();
      expect(result[0].name).toEqual(validPropertyDto.name);
    });

    it('should throw an error if configuration does not exist', async () => {
      const nonExistingConfigName = 'Non existing config';
      await expect(
        service.createProperties({
          projectId,
          name: nonExistingConfigName,
          properties: [validPropertyDto],
        }),
      ).rejects.toThrow(
        new HttpException(
          `Project Fsp configuration with name ${
            nonExistingConfigName
          } not found`,
          HttpStatus.NOT_FOUND,
        ),
      );
      expect(
        mockProjectFspConfigurationPropertyRepository.save,
      ).not.toHaveBeenCalled();
    });
  });

  describe('updateProperty', () => {
    const propertyName = FspConfigurationProperties.brandCode;
    const updatedValue = 'UpdatedValue';
    const updatedPropertyDto = { value: updatedValue };

    it('should successfully update and map the property', async () => {
      await service.updateProperty({
        projectId,
        name: configName,
        propertyName,
        property: updatedPropertyDto,
      });

      expect(
        mockProjectFspConfigurationRepository.findOne,
      ).toHaveBeenCalledWith({
        where: { projectId: Equal(projectId), name: Equal(configName) },
      });
      expect(
        mockProjectFspConfigurationPropertyRepository.save,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          name: propertyName,
          value: updatedValue,
        }),
      );
    });

    it('should throw an error if the property does not exist', async () => {
      mockProjectFspConfigurationPropertyRepository.findOne.mockResolvedValue(
        null,
      );

      await expect(
        service.updateProperty({
          projectId,
          name: configName,
          propertyName,
          property: updatedPropertyDto,
        }),
      ).rejects.toThrow(
        new HttpException(
          `Project Fsp configuration property with name ${propertyName} not found`,
          HttpStatus.NOT_FOUND,
        ),
      );

      expect(
        mockProjectFspConfigurationPropertyRepository.save,
      ).not.toHaveBeenCalled();
    });
  });

  describe('deleteProperty', () => {
    const propertyName = FspConfigurationProperties.brandCode;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should successfully delete the property', async () => {
      mockProjectFspConfigurationRepository.findOne.mockResolvedValue({
        id: 10,
      });
      mockProjectFspConfigurationPropertyRepository.findOne.mockResolvedValue({
        id: 100,
        name: propertyName,
      });

      await service.deleteProperty({
        projectId,
        name: configName,
        propertyName,
      });

      expect(
        mockProjectFspConfigurationRepository.findOne,
      ).toHaveBeenCalledWith({
        where: { projectId: Equal(projectId), name: Equal(configName) },
      });
      expect(
        mockProjectFspConfigurationPropertyRepository.delete,
      ).toHaveBeenCalledWith({
        id: 100,
      });
    });
  });
});
