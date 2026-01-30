import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';

import { IntersolveVisaService } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/services/intersolve-visa.service';
import { ProgramAttributesService } from '@121-service/src/program-attributes/program-attributes.service';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramRegistrationAttributeDto } from '@121-service/src/programs/dto/program-registration-attribute.dto';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';
import { ProgramAttachmentsService } from '@121-service/src/programs/program-attachments/program-attachments.service';
import { ProgramService } from '@121-service/src/programs/programs.service';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { UserService } from '@121-service/src/user/user.service';

describe('ProgramService', () => {
  let service: ProgramService;
  let programRegistrationAttributeRepository: Repository<ProgramRegistrationAttributeEntity>;

  const createAttributeDto = (
    overrides: Partial<ProgramRegistrationAttributeDto> = {},
  ): ProgramRegistrationAttributeDto => {
    return {
      name: 'defaultAttribute',
      type: RegistrationAttributeTypes.text,
      label: { en: 'Default Attribute' },
      ...overrides,
    };
  };

  const createAttributeEntity = (
    overrides: Partial<ProgramRegistrationAttributeEntity> = {},
  ): ProgramRegistrationAttributeEntity => {
    const entity = new ProgramRegistrationAttributeEntity();
    entity.id = 1;
    entity.programId = 1;
    entity.name = 'defaultAttribute';
    entity.type = RegistrationAttributeTypes.text;
    entity.label = { en: 'Default Attribute' };
    entity.options = null;
    entity.scoring = {};
    entity.pattern = null;
    entity.editableInPortal = true;
    entity.includeInTransactionExport = false;
    entity.duplicateCheck = false;
    entity.placeholder = null;
    entity.isRequired = false;
    entity.showInPeopleAffectedTable = false;
    Object.assign(entity, overrides);
    return entity;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgramService,
        {
          provide: 'ProgramEntityRepository',
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: 'ProgramRegistrationAttributeEntityRepository',
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            canActivate: jest.fn(),
            assignAidworkerToProgram: jest.fn(),
          },
        },
        {
          provide: ProgramAttachmentsService,
          useValue: {
            deleteAllProgramAttachments: jest.fn(),
          },
        },
        {
          provide: ProgramAttributesService,
          useValue: {
            getPaEditableAttributes: jest.fn(),
            getAttributes: jest.fn(),
            getFilterableAttributes: jest.fn(),
          },
        },
        {
          provide: ProgramFspConfigurationRepository,
          useValue: {
            find: jest.fn(),
            getByProgramIdAndFspName: jest.fn(),
          },
        },
        {
          provide: IntersolveVisaService,
          useValue: {
            getWallet: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProgramService>(ProgramService);
    programRegistrationAttributeRepository = module.get<
      Repository<ProgramRegistrationAttributeEntity>
    >('ProgramRegistrationAttributeEntityRepository');
  });

  describe('update registration attributes', () => {
    it('should create new attribute when none exist', async () => {
      // Arrange
      const programId = 1;
      const attributes = [
        createAttributeDto({ name: 'firstName', label: { en: 'First Name' } }),
      ];

      jest
        .spyOn(programRegistrationAttributeRepository, 'find')
        .mockResolvedValue([]);

      const saveSpy = jest
        .spyOn(programRegistrationAttributeRepository, 'save')
        .mockImplementation(async (entities: any) => entities);

      // Act
      await service.upsertProgramRegistrationAttributes({
        programId,
        programRegistrationAttributes: attributes,
      });

      // Assert
      const savedEntities = saveSpy.mock.calls[0][0];
      expect(savedEntities).toHaveLength(1);
      expect(savedEntities[0].name).toBe('firstName');
      expect(savedEntities[0].programId).toBe(programId);
    });

    it('should update existing attributes', async () => {
      // Arrange
      const programId = 1;
      const existingEntity = createAttributeEntity({
        id: 10,
        name: 'firstName',
        label: { en: 'Old Label' },
        isRequired: false,
      });

      const updateDto = createAttributeDto({
        name: 'firstName',
        label: { en: 'Updated First Name' },
        isRequired: true,
      });

      jest
        .spyOn(programRegistrationAttributeRepository, 'find')
        .mockResolvedValue([existingEntity]);

      const saveSpy = jest
        .spyOn(programRegistrationAttributeRepository, 'save')
        .mockImplementation(async (entities: any) => entities);

      // Act
      await service.upsertProgramRegistrationAttributes({
        programId,
        programRegistrationAttributes: [updateDto],
      });

      // Assert
      const savedEntities = saveSpy.mock.calls[0][0];
      expect(savedEntities).toHaveLength(1);
      expect(savedEntities[0].id).toBe(10); // Keeps original ID
      expect(savedEntities[0].name).toBe('firstName');
      expect(savedEntities[0].label).toEqual({ en: 'Updated First Name' });
      expect(savedEntities[0].isRequired).toBe(true);
    });
  });
});
