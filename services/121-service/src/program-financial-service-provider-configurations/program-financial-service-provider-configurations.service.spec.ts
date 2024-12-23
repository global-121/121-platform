import { HttpException, HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Equal } from 'typeorm';

import {
  FinancialServiceProviderConfigurationProperties,
  FinancialServiceProviders,
} from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.repository';
import { CreateProgramFinancialServiceProviderConfigurationDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/create-program-financial-service-provider-configuration.dto';
import { CreateProgramFinancialServiceProviderConfigurationPropertyDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/create-program-financial-service-provider-configuration-property.dto';
import { UpdateProgramFinancialServiceProviderConfigurationDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/update-program-financial-service-provider-configuration.dto';
import { ProgramFinancialServiceProviderConfigurationEntity } from '@121-service/src/program-financial-service-provider-configurations/entities/program-financial-service-provider-configuration.entity';
import { ProgramFinancialServiceProviderConfigurationPropertyEntity } from '@121-service/src/program-financial-service-provider-configurations/entities/program-financial-service-provider-configuration-property.entity';
import { ProgramFinancialServiceProviderConfigurationsService } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.service';

const programId = 1;
const mockProgramFspConfigPropertyEntity =
  new ProgramFinancialServiceProviderConfigurationPropertyEntity();
mockProgramFspConfigPropertyEntity.id = 1;
mockProgramFspConfigPropertyEntity.name =
  FinancialServiceProviderConfigurationProperties.brandCode;
mockProgramFspConfigPropertyEntity.value = '123';
mockProgramFspConfigPropertyEntity.programFinancialServiceProviderConfigurationId = 1;

const configName = 'Config 1';
const mockProgramFspConfigEntity =
  new ProgramFinancialServiceProviderConfigurationEntity();
mockProgramFspConfigEntity.id = 1;
mockProgramFspConfigEntity.name = configName;
mockProgramFspConfigEntity.programId = 1;
mockProgramFspConfigEntity.financialServiceProviderName =
  FinancialServiceProviders.intersolveVisa;
mockProgramFspConfigEntity.label = { en: 'Test Label' };
mockProgramFspConfigEntity.properties = [mockProgramFspConfigPropertyEntity];
mockProgramFspConfigEntity.registrations = [];

const validPropertyDto: CreateProgramFinancialServiceProviderConfigurationPropertyDto =
  {
    name: FinancialServiceProviderConfigurationProperties.brandCode,
    value: '123',
  };

// Declaring mocks here so they are accesble through all files
let mockProgramFspConfigurationRepository;
let mockProgramFspConfigurationPropertyRepository;
let mockTransactionScopedRepository;

describe('ProgramFinancialServiceProviderConfigurationsService', () => {
  let service: ProgramFinancialServiceProviderConfigurationsService;

  beforeEach(async () => {
    mockProgramFspConfigurationRepository = {
      find: jest.fn().mockImplementation((criteria) => {
        const programIdOfWhere = criteria.where.programId._value;
        const nameWhere = criteria.where?.name?._value;

        if (programIdOfWhere === 1 && !nameWhere) {
          return [mockProgramFspConfigEntity];
        } else if (programIdOfWhere === 1 && nameWhere === configName) {
          return [mockProgramFspConfigEntity];
        } else {
          return [];
        }
      }),
      findOne: jest.fn().mockImplementation((criteria) => {
        const programIdOfWhere = criteria.where.programId._value;
        const nameWhere = criteria.where?.name?._value;

        if (programIdOfWhere === 1 && !nameWhere) {
          return mockProgramFspConfigEntity;
        } else if (programIdOfWhere === 1 && nameWhere === configName) {
          return mockProgramFspConfigEntity;
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

    mockProgramFspConfigurationPropertyRepository = {
      delete: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(mockProgramFspConfigPropertyEntity),
      save: jest.fn().mockImplementation((entity) => {
        return entity; // Return the entity it receives
      }),
    };

    mockTransactionScopedRepository = {
      count: jest.fn().mockImplementation((criteria) => {
        const programFinancialServiceProviderConfigurationIdOfWhere =
          criteria.where.programFinancialServiceProviderConfigurationId._value;

        if (programFinancialServiceProviderConfigurationIdOfWhere === 1) {
          return 0;
        }
        return 1;
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ProgramFinancialServiceProviderConfigurationsService,
        {
          provide: getRepositoryToken(
            ProgramFinancialServiceProviderConfigurationEntity,
          ),
          useValue: mockProgramFspConfigurationRepository,
        },
        {
          provide: getRepositoryToken(
            ProgramFinancialServiceProviderConfigurationPropertyEntity,
          ),
          useValue: mockProgramFspConfigurationPropertyRepository,
        },
        {
          provide: TransactionScopedRepository,
          useValue: mockTransactionScopedRepository,
        },
      ],
    }).compile();

    service =
      moduleRef.get<ProgramFinancialServiceProviderConfigurationsService>(
        ProgramFinancialServiceProviderConfigurationsService,
      );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByProgramId', () => {
    it('should return program configurations for a given program ID', async () => {
      const result = await service.getByProgramId(programId);

      expect(mockProgramFspConfigurationRepository.find).toHaveBeenCalledWith({
        where: { programId: Equal(programId) },
        relations: ['properties'],
      });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
    });
  });

  describe('validateAndCreate', () => {
    const createDto: CreateProgramFinancialServiceProviderConfigurationDto = {
      name: 'Test Configuration',
      financialServiceProviderName: FinancialServiceProviders.intersolveVisa,
      label: { en: 'Test Label' },
      properties: [
        {
          name: FinancialServiceProviderConfigurationProperties.brandCode,
          value: '123',
        },
      ],
    };

    it('should validate successfully if all checks pass', async () => {
      await expect(service.create(programId, createDto)).resolves.not.toThrow();
      expect(
        mockProgramFspConfigurationRepository.findOne,
      ).toHaveBeenCalledWith({
        where: {
          name: Equal(createDto.name),
          programId: Equal(programId),
        },
      });
      expect(mockProgramFspConfigurationRepository.save).toHaveBeenCalled();
    });

    it('should throw an exception if english is not provided', async () => {
      const noEnglishLabelDto = {
        ...createDto,
        label: { fr: 'Test Label' },
      };
      await expect(
        service.create(programId, noEnglishLabelDto),
      ).rejects.toThrow(HttpException);
      await expect(
        service.create(programId, noEnglishLabelDto),
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
        service.create(programId, duplivateNameCreateDto),
      ).rejects.toThrow(HttpException);
      await expect(
        service.create(programId, duplivateNameCreateDto),
      ).rejects.toThrow(
        new HttpException(
          `Program Financial Service Provider with name ${duplivateNameCreateDto.name} already exists`,
          HttpStatus.CONFLICT,
        ),
      );
    });

    it('should throw an exception if properties contain invalid name for fsp', async () => {
      const invalidPropertiesDto = {
        ...createDto,
        properties: [
          {
            name: FinancialServiceProviderConfigurationProperties.password,
            value: '123',
          },
        ],
      };
      await expect(
        service.create(programId, invalidPropertiesDto),
      ).rejects.toThrow();
      await expect(
        service.create(programId, invalidPropertiesDto),
      ).rejects.toThrow(new RegExp(`only the following values are allowed`));
    });

    it('should throw an exception if properties contain a duplicate name', async () => {
      const invalidPropertiesDto = {
        ...createDto,
        properties: [
          {
            name: FinancialServiceProviderConfigurationProperties.brandCode,
            value: '123',
          },
          {
            name: FinancialServiceProviderConfigurationProperties.brandCode,
            value: 'again another brandcode',
          },
        ],
      };
      await expect(
        service.create(programId, invalidPropertiesDto),
      ).rejects.toThrow();
      await expect(
        service.create(programId, invalidPropertiesDto),
      ).rejects.toThrow(new RegExp(`Duplicate property names are not allowed`));
    });
  });

  describe('update', () => {
    it('should successfully update the configuration', async () => {
      const updateDto: UpdateProgramFinancialServiceProviderConfigurationDto = {
        label: { en: 'Updated Label' },
        properties: [],
      };

      const result = await service.update(programId, configName, updateDto);

      expect(
        mockProgramFspConfigurationRepository.findOne,
      ).toHaveBeenCalledWith({
        where: {
          name: Equal(configName),
          programId: Equal(programId),
        },
      });
      expect(
        mockProgramFspConfigurationPropertyRepository.delete,
      ).toHaveBeenCalledWith({
        programFinancialServiceProviderConfigurationId: Equal(
          mockProgramFspConfigPropertyEntity.programFinancialServiceProviderConfigurationId,
        ),
      });
      expect(mockProgramFspConfigurationRepository.save).toHaveBeenCalled();
      expect(result.label).toEqual(updateDto.label);
    });

    it('should throw an exception if the configuration does not exist', async () => {
      const updateDto: UpdateProgramFinancialServiceProviderConfigurationDto = {
        label: { en: 'Updated Label' },
        properties: [],
      };
      const nonExistingConfigName = 'Non existing config';

      await expect(
        service.update(programId, nonExistingConfigName, updateDto),
      ).rejects.toThrow(HttpException);
      expect(
        mockProgramFspConfigurationPropertyRepository.delete,
      ).not.toHaveBeenCalled();
      await expect(
        service.update(programId, nonExistingConfigName, updateDto),
      ).rejects.toThrow(new HttpException('Not found', HttpStatus.NOT_FOUND));
    });
  });

  describe('delete', () => {
    it('should successfully delete the configuration', async () => {
      await service.delete(programId, configName);

      expect(
        mockProgramFspConfigurationRepository.findOne,
      ).toHaveBeenCalledWith({
        where: {
          name: Equal(configName),
          programId: Equal(programId),
        },
        relations: ['registrations'],
      });
      expect(mockProgramFspConfigurationRepository.delete).toHaveBeenCalledWith(
        {
          id: mockProgramFspConfigEntity.id,
        },
      );
    });

    it('should throw an exception if the configuration does not exist', async () => {
      // Mocking findOne to return null (configuration not found)
      const nonExistingConfigName = 'Non existing config';

      await expect(
        service.delete(programId, nonExistingConfigName),
      ).rejects.toThrow(HttpException);
      await expect(
        service.delete(programId, nonExistingConfigName),
      ).rejects.toThrow(new HttpException('Not found', HttpStatus.NOT_FOUND));
    });
  });

  describe('validateAndCreateProperties', () => {
    it('should succesfully map and create properties', async () => {
      const result = await service.createProperties({
        programId,
        name: configName,
        properties: [validPropertyDto],
      });
      expect(mockProgramFspConfigurationRepository.findOne).toHaveBeenCalled();
      expect(
        mockProgramFspConfigurationPropertyRepository.save,
      ).toHaveBeenCalled();
      expect(result[0].name).toEqual(validPropertyDto.name);
    });

    it('should throw an error if configuration does not exist', async () => {
      const nonExistingConfigName = 'Non existing config';
      await expect(
        service.createProperties({
          programId,
          name: nonExistingConfigName,
          properties: [validPropertyDto],
        }),
      ).rejects.toThrow(
        new HttpException(
          `Program financial service provider configuration with name ${
            nonExistingConfigName
          } not found`,
          HttpStatus.NOT_FOUND,
        ),
      );
      expect(
        mockProgramFspConfigurationPropertyRepository.save,
      ).not.toHaveBeenCalled();
    });
  });

  describe('updateProperty', () => {
    const propertyName =
      FinancialServiceProviderConfigurationProperties.brandCode;
    const updatedValue = 'UpdatedValue';
    const updatedPropertyDto = { value: updatedValue };

    it('should successfully update and map the property', async () => {
      await service.updateProperty({
        programId,
        name: configName,
        propertyName,
        property: updatedPropertyDto,
      });

      expect(
        mockProgramFspConfigurationRepository.findOne,
      ).toHaveBeenCalledWith({
        where: { programId: Equal(programId), name: Equal(configName) },
      });
      expect(
        mockProgramFspConfigurationPropertyRepository.save,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          name: propertyName,
          value: updatedValue,
        }),
      );
    });

    it('should throw an error if the property does not exist', async () => {
      mockProgramFspConfigurationPropertyRepository.findOne.mockResolvedValue(
        null,
      );

      await expect(
        service.updateProperty({
          programId,
          name: configName,
          propertyName,
          property: updatedPropertyDto,
        }),
      ).rejects.toThrow(
        new HttpException(
          `Program financial service provider configuration property with name ${propertyName} not found`,
          HttpStatus.NOT_FOUND,
        ),
      );

      expect(
        mockProgramFspConfigurationPropertyRepository.save,
      ).not.toHaveBeenCalled();
    });
  });

  describe('deleteProperty', () => {
    const propertyName =
      FinancialServiceProviderConfigurationProperties.brandCode;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should successfully delete the property', async () => {
      mockProgramFspConfigurationRepository.findOne.mockResolvedValue({
        id: 10,
      });
      mockProgramFspConfigurationPropertyRepository.findOne.mockResolvedValue({
        id: 100,
        name: propertyName,
      });

      await service.deleteProperty({
        programId,
        name: configName,
        propertyName,
      });

      expect(
        mockProgramFspConfigurationRepository.findOne,
      ).toHaveBeenCalledWith({
        where: { programId: Equal(programId), name: Equal(configName) },
      });
      expect(
        mockProgramFspConfigurationPropertyRepository.delete,
      ).toHaveBeenCalledWith({
        id: 100,
      });
    });
  });
});
