import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ExcelFspConfigurationEntity } from '@121-service/src/fsp-integrations/integrations/excel/entities/excel-fsp-configuration.entity';
import { ExcelFspConfigurationRepository } from '@121-service/src/fsp-integrations/integrations/excel/excel-fsp-configuration.repository';
import { ExcelFspConfigurationService } from '@121-service/src/fsp-integrations/integrations/excel/excel-fsp-configuration.service';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { PaymentsProgressService } from '@121-service/src/payments/services/payments-progress.service';
import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';
import { FspConfigurationStates } from '@121-service/src/program-fsp-configurations/enum/fsp-configuration-states.enum';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramRegistrationAttributeRepository } from '@121-service/src/programs/repositories/program-registration-attribute.repository';

const programId = 1;
const configurationName = 'excel-configuration';

const excelFspConfiguration = new ProgramFspConfigurationEntity();
excelFspConfiguration.id = 1;
excelFspConfiguration.programId = programId;
excelFspConfiguration.name = configurationName;
excelFspConfiguration.label = { en: 'Excel configuration' };
excelFspConfiguration.fspName = Fsps.excel;

const programAttributeNames = ['fullName', 'phoneNumber'];

describe('ExcelFspConfigurationService', () => {
  let service: ExcelFspConfigurationService;
  let excelFspConfigurationRepository: {
    getByProgramFspConfigurationId: jest.Mock;
    saveConfiguration: jest.Mock;
  };
  let programFspConfigurationRepository: {
    getByProgramIdAndName: jest.Mock;
    updateState: jest.Mock;
  };

  beforeEach(async () => {
    excelFspConfigurationRepository = {
      getByProgramFspConfigurationId: jest.fn(),
      saveConfiguration: jest.fn().mockImplementation((configuration) => ({
        ...configuration,
      })),
    };
    programFspConfigurationRepository = {
      getByProgramIdAndName: jest.fn().mockResolvedValue(excelFspConfiguration),
      updateState: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExcelFspConfigurationService,
        {
          provide: ExcelFspConfigurationRepository,
          useValue: excelFspConfigurationRepository,
        },
        {
          provide: ProgramFspConfigurationRepository,
          useValue: programFspConfigurationRepository,
        },
        {
          provide: ProgramRegistrationAttributeRepository,
          useValue: {
            getNamesByProgramId: jest
              .fn()
              .mockResolvedValue(programAttributeNames),
          },
        },
        {
          provide: PaymentsProgressService,
          useValue: {
            checkPaymentInProgressAndThrow: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ExcelFspConfigurationService);
  });

  describe('getConfiguration', () => {
    it('should return empty details when no Excel details have been saved yet', async () => {
      // Arrange
      excelFspConfigurationRepository.getByProgramFspConfigurationId.mockResolvedValue(
        null,
      );

      // Act
      const result = await service.getConfiguration({
        programId,
        configurationName,
      });

      // Assert
      expect(result).toEqual({
        name: configurationName,
        label: { en: 'Excel configuration' },
        uniqueIdentifierField: '',
        exportFields: [],
      });
    });

    it('should return the saved Excel details', async () => {
      // Arrange
      const savedConfiguration = new ExcelFspConfigurationEntity();
      savedConfiguration.uniqueIdentifierField = 'phoneNumber';
      savedConfiguration.exportFields = ['fullName'];
      excelFspConfigurationRepository.getByProgramFspConfigurationId.mockResolvedValue(
        savedConfiguration,
      );

      // Act
      const result = await service.getConfiguration({
        programId,
        configurationName,
      });

      // Assert
      expect(result.uniqueIdentifierField).toBe('phoneNumber');
      expect(result.exportFields).toEqual(['fullName']);
    });

    it('should throw NOT_FOUND when the configuration does not exist', async () => {
      // Arrange
      programFspConfigurationRepository.getByProgramIdAndName.mockResolvedValue(
        null,
      );

      // Act & Assert
      await expect(
        service.getConfiguration({ programId, configurationName }),
      ).rejects.toMatchObject({ status: HttpStatus.NOT_FOUND });
    });

    it('should throw NOT_FOUND when the configuration is not an Excel configuration', async () => {
      // Arrange
      programFspConfigurationRepository.getByProgramIdAndName.mockResolvedValue({
        ...excelFspConfiguration,
        fspName: Fsps.intersolveVisa,
      });

      // Act & Assert
      await expect(
        service.getConfiguration({ programId, configurationName }),
      ).rejects.toMatchObject({ status: HttpStatus.NOT_FOUND });
    });
  });

  describe('createOrReplaceConfiguration', () => {
    it('should default omitted exportFields to all program attributes', async () => {
      // Arrange
      const configuration = { uniqueIdentifierField: 'phoneNumber' };

      // Act
      const result = await service.createOrReplaceConfiguration({
        programId,
        configurationName,
        configuration,
      });

      // Assert
      expect(
        excelFspConfigurationRepository.saveConfiguration,
      ).toHaveBeenCalledWith({
        programFspConfigurationId: excelFspConfiguration.id,
        uniqueIdentifierField: 'phoneNumber',
        exportFields: programAttributeNames,
      });
      expect(result.exportFields).toEqual(programAttributeNames);
      expect(
        programFspConfigurationRepository.updateState,
      ).toHaveBeenCalledWith({
        programId,
        name: configurationName,
        state: FspConfigurationStates.configured,
      });
    });

    it('should accept an explicit empty exportFields selection', async () => {
      // Arrange
      const configuration = {
        uniqueIdentifierField: 'phoneNumber',
        exportFields: [],
      };

      // Act
      const result = await service.createOrReplaceConfiguration({
        programId,
        configurationName,
        configuration,
      });

      // Assert
      expect(
        excelFspConfigurationRepository.saveConfiguration,
      ).toHaveBeenCalledWith({
        programFspConfigurationId: excelFspConfiguration.id,
        uniqueIdentifierField: 'phoneNumber',
        exportFields: [],
      });
      expect(result.exportFields).toEqual([]);
    });

    it('should throw BAD_REQUEST when the uniqueIdentifierField is not a program attribute', async () => {
      // Arrange
      const configuration = { uniqueIdentifierField: 'notAnAttribute' };

      // Act & Assert
      await expect(
        service.createOrReplaceConfiguration({
          programId,
          configurationName,
          configuration,
        }),
      ).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
        message: expect.stringContaining('notAnAttribute'),
      });
    });

    it('should throw BAD_REQUEST listing each invalid export field once', async () => {
      // Arrange
      const configuration = {
        uniqueIdentifierField: 'notAnAttribute',
        exportFields: [
          'notAnAttribute',
          'alsoNotAnAttribute',
          'notAnAttribute',
        ],
      };

      // Act
      const promise = service.createOrReplaceConfiguration({
        programId,
        configurationName,
        configuration,
      });

      // Assert
      await expect(promise).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
        message:
          'Excel configuration fields must be registration attributes in the program: notAnAttribute, alsoNotAnAttribute',
      });
    });

    it('should throw NOT_FOUND when the configuration does not exist', async () => {
      // Arrange
      programFspConfigurationRepository.getByProgramIdAndName.mockResolvedValue(
        null,
      );

      // Act & Assert
      await expect(
        service.createOrReplaceConfiguration({
          programId,
          configurationName,
          configuration: { uniqueIdentifierField: 'phoneNumber' },
        }),
      ).rejects.toMatchObject({ status: HttpStatus.NOT_FOUND });
    });

    it('should throw NOT_FOUND when the configuration is not an Excel configuration', async () => {
      // Arrange
      programFspConfigurationRepository.getByProgramIdAndName.mockResolvedValue({
        ...excelFspConfiguration,
        fspName: Fsps.intersolveVisa,
      });

      // Act & Assert
      await expect(
        service.createOrReplaceConfiguration({
          programId,
          configurationName,
          configuration: { uniqueIdentifierField: 'phoneNumber' },
        }),
      ).rejects.toMatchObject({ status: HttpStatus.NOT_FOUND });
    });
  });
});
