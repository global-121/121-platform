import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Equal, Repository } from 'typeorm';

import { ActionEntity } from '@121-service/src/actions/action.entity';
import { IntersolveVisaService } from '@121-service/src/payments/fsp-integration/intersolve-visa/services/intersolve-visa.service';
import { ProgramAttributesService } from '@121-service/src/program-attributes/program-attributes.service';
import { ProgramFspConfigurationMapper } from '@121-service/src/program-fsp-configurations/mappers/program-fsp-configuration.mapper';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';
import { ProgramAttachmentsService } from '@121-service/src/programs/program-attachments/program-attachments.service';
import { ProgramService } from '@121-service/src/programs/programs.service';
import { UserService } from '@121-service/src/user/user.service';

describe('ProgramService', () => {
  let service: ProgramService;
  let programRepository: Repository<ProgramEntity>;
  let programRegistrationAttributeRepository: Repository<ProgramRegistrationAttributeEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgramService,
        {
          provide: getRepositoryToken(ProgramEntity),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(ProgramRegistrationAttributeEntity),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(ActionEntity),
          useClass: Repository,
        },
        {
          provide: UserService,
          useValue: {
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
          useValue: {},
        },
        {
          provide: IntersolveVisaService,
          useValue: {},
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue({
              startTransaction: jest.fn(),
              manager: {
                getRepository: jest.fn(),
              },
              commitTransaction: jest.fn(),
              rollbackTransaction: jest.fn(),
              release: jest.fn(),
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ProgramService>(ProgramService);
    programRepository = module.get<Repository<ProgramEntity>>(
      getRepositoryToken(ProgramEntity),
    );
    programRegistrationAttributeRepository = module.get<
      Repository<ProgramRegistrationAttributeEntity>
    >(getRepositoryToken(ProgramRegistrationAttributeEntity));

    ProgramFspConfigurationMapper.mapPropertyEntitiesToDtos = jest
      .fn()
      .mockReturnValue([]);
  });

  // Not completely tested.
  describe('findProgramOrThrow', () => {
    it('should return a program if found', async () => {
      // Arrange
      const programId = 1;
      const mockProgram = { id: programId, programFspConfigurations: [] };
      jest.spyOn(programRepository, 'findOne').mockResolvedValue(mockProgram);
      jest
        .spyOn(programRegistrationAttributeRepository, 'find')
        .mockResolvedValue([]);

      // Act
      const result = await service.findProgramOrThrow(programId);

      // Assert
      expect(result).toEqual(mockProgram);
      expect(programRepository.findOne).toHaveBeenCalledWith({
        where: { id: Equal(programId) },
        relations: ['programFspConfigurations'],
      });
    });

    it('should throw NotFoundException if program is not found', async () => {
      // Arrange
      const programId = 1;
      jest.spyOn(programRepository, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(service.findProgramOrThrow(programId)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('deleteProgram', () => {
    it('should delete a program', async () => {
      // Arrange
      const programId = 1;
      const mockProgram = { id: programId } as ProgramEntity;
      jest
        .spyOn(service, 'findProgramOrThrow')
        .mockResolvedValue(mockProgram as any);
      jest.spyOn(programRepository, 'remove').mockResolvedValue(mockProgram);

      // Act
      await service.deleteProgram(programId);

      // Assert
      expect(service.findProgramOrThrow).toHaveBeenCalledWith(programId);
      expect(programRepository.remove).toHaveBeenCalledWith(mockProgram);
    });
  });
});
