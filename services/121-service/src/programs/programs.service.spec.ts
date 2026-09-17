import { TestBed } from '@automock/jest';
import { HttpStatus } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

jest.mock('@121-service/src/env', () => ({
  env: {
    NODE_ENV: 'development',
  },
}));

import { ProgramRegistrationAttributeLockService } from '@121-service/src/program-registration-attributes/program-registration-attribute-lock.service';
import { FoundProgramDto } from '@121-service/src/programs/dto/found-program.dto';
import { UpdateProgramDto } from '@121-service/src/programs/dto/update-program.dto';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';
import { ProgramService } from '@121-service/src/programs/programs.service';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';

describe('ProgramService', () => {
  let service: ProgramService;
  let programRepository: jest.Mocked<Repository<ProgramEntity>>;

  const programId = 1;

  const createMockAttribute = ({
    name,
    type = RegistrationAttributeTypes.dropdown,
  }: {
    name: string;
    type?: RegistrationAttributeTypes;
  }): ProgramRegistrationAttributeEntity =>
    ({
      id: 1,
      programId,
      name,
      type,
    }) as ProgramRegistrationAttributeEntity;

  const createMockProgram = (
    overrides?: Partial<FoundProgramDto>,
  ): FoundProgramDto =>
    ({
      id: programId,
      validation: false,
      location: null,
      ngo: null,
      titlePortal: null,
      description: null,
      startDate: null,
      endDate: null,
      currency: null,
      distributionFrequency: null,
      distributionDuration: null,
      fixedTransferValue: null,
      paymentAmountMultiplierFormula: null,
      targetNrRegistrations: null,
      fullnameNamingConvention: null,
      scopeRegistrationAttributeNames: null,
      languages: [],
      enableMaxPayments: false,
      enableScope: false,
      budget: null,
      programFspConfigurations: [],
      programRegistrationAttributes: [
        createMockAttribute({ name: 'region' }),
        createMockAttribute({ name: 'district' }),
        createMockAttribute({ name: 'subDistrict' }),
        createMockAttribute({
          name: 'textAttribute',
          type: RegistrationAttributeTypes.text,
        }),
      ],
      ...overrides,
    }) as FoundProgramDto;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(ProgramService)
      .mock(ProgramRegistrationAttributeLockService)
      .using(new ProgramRegistrationAttributeLockService())
      .compile();

    service = unit;
    programRepository = unitRef.get(
      getRepositoryToken(ProgramEntity) as unknown as string,
    );
  });

  describe('Updating program scope registration attributes', () => {
    it('should successfully update program when valid dropdown attributes are provided', async () => {
      // Arrange
      const existingProgram = createMockProgram();
      const updateDto: UpdateProgramDto = {
        scopeRegistrationAttributeNames: ['region', 'district'],
      };

      jest.spyOn(service, 'findProgramOrThrow').mockResolvedValue(existingProgram);
      programRepository.save.mockImplementation((entity) =>
        Promise.resolve(entity as ProgramEntity),
      );

      // Act
      const result = await service.updateProgram(programId, updateDto);

      // Assert
      expect(result.scopeRegistrationAttributeNames).toEqual([
        'region',
        'district',
      ]);
      expect(programRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          scopeRegistrationAttributeNames: ['region', 'district'],
        }),
      );
    });

    it('should clear scope registration attributes when given an empty array', async () => {
      // Arrange
      const existingProgram = createMockProgram({
        scopeRegistrationAttributeNames: ['region', 'district'],
      });
      const updateDto: UpdateProgramDto = {
        scopeRegistrationAttributeNames: [],
      };

      jest.spyOn(service, 'findProgramOrThrow').mockResolvedValue(existingProgram);
      programRepository.save.mockImplementation((entity) =>
        Promise.resolve(entity as ProgramEntity),
      );

      // Act
      const result = await service.updateProgram(programId, updateDto);

      // Assert
      expect(result.scopeRegistrationAttributeNames).toBeUndefined();
      expect(programRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          scopeRegistrationAttributeNames: null,
        }),
      );
    });

    it('should throw when more than 3 scope attributes are provided', async () => {
      // Arrange
      const existingProgram = createMockProgram();
      const updateDto: UpdateProgramDto = {
        scopeRegistrationAttributeNames: [
          'region',
          'district',
          'subDistrict',
          'extraDistrict',
        ],
      };

      jest.spyOn(service, 'findProgramOrThrow').mockResolvedValue(existingProgram);

      // Act & Assert
      await expect(
        service.updateProgram(programId, updateDto),
      ).rejects.toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
    });

    it('should throw when an attribute does not exist on the program', async () => {
      // Arrange
      const existingProgram = createMockProgram();
      const updateDto: UpdateProgramDto = {
        scopeRegistrationAttributeNames: ['nonExistentAttribute'],
      };

      jest.spyOn(service, 'findProgramOrThrow').mockResolvedValue(existingProgram);

      // Act & Assert
      await expect(
        service.updateProgram(programId, updateDto),
      ).rejects.toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
    });

    it('should throw when an attribute is not of type dropdown', async () => {
      // Arrange
      const existingProgram = createMockProgram();
      const updateDto: UpdateProgramDto = {
        scopeRegistrationAttributeNames: ['textAttribute'],
      };

      jest.spyOn(service, 'findProgramOrThrow').mockResolvedValue(existingProgram);

      // Act & Assert
      await expect(
        service.updateProgram(programId, updateDto),
      ).rejects.toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
    });

    it('should preserve existing scope attributes when scopeRegistrationAttributeNames is omitted', async () => {
      // Arrange
      const existingProgram = createMockProgram({
        location: 'Old Location',
        scopeRegistrationAttributeNames: ['region', 'district'],
      });
      const updateDto: UpdateProgramDto = {
        location: 'New Location',
      };

      jest.spyOn(service, 'findProgramOrThrow').mockResolvedValue(existingProgram);
      programRepository.save.mockImplementation((entity) =>
        Promise.resolve(entity as ProgramEntity),
      );

      // Act
      const result = await service.updateProgram(programId, updateDto);

      // Assert
      expect(result.location).toBe('New Location');
      expect(result.scopeRegistrationAttributeNames).toEqual([
        'region',
        'district',
      ]);
      expect(programRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          location: 'New Location',
          scopeRegistrationAttributeNames: ['region', 'district'],
        }),
      );
    });
  });
});
