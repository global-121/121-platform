import { HttpException, HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Equal } from 'typeorm';

import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { CreateProgramFspConfigurationDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration.dto';
import { CreateProgramFspConfigurationPropertyDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration-property.dto';
import { UpdateProgramFspConfigurationDto } from '@121-service/src/program-fsp-configurations/dtos/update-program-fsp-configuration.dto';
import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';
import { ProgramFspConfigurationPropertyEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration-property.entity';
import { ProgramFspConfigurationsService } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.service';

const programId = 1;
const mockProgramFspConfigPropertyEntity =
  new ProgramFspConfigurationPropertyEntity();
mockProgramFspConfigPropertyEntity.id = 1;
mockProgramFspConfigPropertyEntity.name = FspConfigurationProperties.brandCode;
mockProgramFspConfigPropertyEntity.value = '123';
mockProgramFspConfigPropertyEntity.programFspConfigurationId = 1;

const configName = 'Config 1';
const mockProgramFspConfigEntity = new ProgramFspConfigurationEntity();
mockProgramFspConfigEntity.id = 1;
mockProgramFspConfigEntity.name = configName;
mockProgramFspConfigEntity.programId = 1;
mockProgramFspConfigEntity.fspName = Fsps.intersolveVisa;
mockProgramFspConfigEntity.label = { en: 'Test Label' };
mockProgramFspConfigEntity.properties = [mockProgramFspConfigPropertyEntity];
mockProgramFspConfigEntity.registrations = [];

const validPropertyDto: CreateProgramFspConfigurationPropertyDto = {
  name: FspConfigurationProperties.brandCode,
  value: '123',
};

// Declaring mocks here so they are accessible through all files
let mockProgramFspConfigurationRepository;
let mockProgramFspConfigurationPropertyRepository;

describe('ProgramFspConfigurationsService', () => {
  let service: ProgramFspConfigurationsService;

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

    const moduleRef = await Test.createTestingModule({
      providers: [
        ProgramFspConfigurationsService,
        {
          provide: getRepositoryToken(ProgramFspConfigurationEntity),
          useValue: mockProgramFspConfigurationRepository,
        },
        {
          provide: getRepositoryToken(ProgramFspConfigurationPropertyEntity),
          useValue: mockProgramFspConfigurationPropertyRepository,
        },
      ],
    }).compile();

    service = moduleRef.get<ProgramFspConfigurationsService>(
      ProgramFspConfigurationsService,
    );
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

  describe('getPublicFspConfigurationProperties', () => {
    it('should return allowlisted public properties for Intersolve Visa', async () => {
      const publicProperty = new ProgramFspConfigurationPropertyEntity();
      publicProperty.id = 10;
      publicProperty.name = FspConfigurationProperties.cardDistributionByMail;
      publicProperty.value = 'true';
      publicProperty.programFspConfigurationId = mockProgramFspConfigEntity.id;

      mockProgramFspConfigurationPropertyRepository.find.mockResolvedValueOnce([
        publicProperty,
      ]);

      const result = await service.getPublicFspConfigurationProperties(
        programId,
        configName,
      );

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: FspConfigurationProperties.cardDistributionByMail,
            value: 'true',
          }),
        ]),
      );
    });

    it('should return empty array for FSP that do not have allow listed properties', async () => {
      const nonAllowlistedConfig = { ...mockProgramFspConfigEntity };
      nonAllowlistedConfig.fspName = Fsps.excel;
      mockProgramFspConfigurationRepository.findOne.mockResolvedValueOnce(
        nonAllowlistedConfig,
      );

      const result = await service.getPublicFspConfigurationProperties(
        programId,
        configName,
      );

      expect(result).toEqual([]);
    });
  });

  describe('validateAndCreate', () => {
    const createDto: CreateProgramFspConfigurationDto = {
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
          `Program Fsp with name ${duplivateNameCreateDto.name} already exists`,
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
        service.create(programId, invalidPropertiesDto),
      ).rejects.toThrow();
      await expect(
        service.create(programId, invalidPropertiesDto),
      ).rejects.toThrow(new RegExp(`Duplicate property names are not allowed`));
    });

    it('should throw an exception if a property value has an invalid type', async () => {
      const invalidTypeDto: CreateProgramFspConfigurationDto = {
        ...createDto,
        properties: [
          {
            name: FspConfigurationProperties.maxToSpendPerMonthInCents,
            value: '25000',
          },
        ],
      };

      await expect(service.create(programId, invalidTypeDto)).rejects.toThrow(
        new RegExp('Invalid value type'),
      );
    });
  });

  describe('update', () => {
    it('should successfully update the configuration', async () => {
      const updateDto: UpdateProgramFspConfigurationDto = {
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
        programFspConfigurationId: Equal(
          mockProgramFspConfigPropertyEntity.programFspConfigurationId,
        ),
      });
      expect(mockProgramFspConfigurationRepository.save).toHaveBeenCalled();
      expect(result.label).toEqual(updateDto.label);
    });

    it('should throw an exception if the configuration does not exist', async () => {
      const updateDto: UpdateProgramFspConfigurationDto = {
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

    it('should throw an exception if an updated property value has an invalid type', async () => {
      const updateDto: UpdateProgramFspConfigurationDto = {
        label: { en: 'Updated Label' },
        properties: [
          {
            name: FspConfigurationProperties.maxToSpendPerMonthInCents,
            value: '25000',
          },
        ],
      };

      await expect(
        service.update(programId, configName, updateDto),
      ).rejects.toThrow(new RegExp('Invalid value type'));
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
    it('should successfully map and create properties', async () => {
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
          `Program Fsp configuration with name ${
            nonExistingConfigName
          } not found`,
          HttpStatus.NOT_FOUND,
        ),
      );
      expect(
        mockProgramFspConfigurationPropertyRepository.save,
      ).not.toHaveBeenCalled();
    });

    it('should throw an error if a property value has an invalid type', async () => {
      const invalidPropertiesDto: CreateProgramFspConfigurationPropertyDto[] = [
        {
          name: FspConfigurationProperties.cardDistributionByMail,
          value: 'true',
        },
      ];

      await expect(
        service.createProperties({
          programId,
          name: configName,
          properties: invalidPropertiesDto,
        }),
      ).rejects.toThrow(new RegExp('Invalid value type'));
    });
  });

  describe('updateProperty', () => {
    const propertyName = FspConfigurationProperties.brandCode;
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
          `Program Fsp configuration property with name ${propertyName} not found`,
          HttpStatus.NOT_FOUND,
        ),
      );

      expect(
        mockProgramFspConfigurationPropertyRepository.save,
      ).not.toHaveBeenCalled();
    });

    it('should throw an error if the property value has an invalid type', async () => {
      await expect(
        service.updateProperty({
          programId,
          name: configName,
          propertyName: FspConfigurationProperties.cardDistributionByMail,
          property: { value: 'true' },
        }),
      ).rejects.toThrow(new RegExp('Invalid value type'));
    });
  });

  describe('deleteProperty', () => {
    const propertyName = FspConfigurationProperties.brandCode;

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
