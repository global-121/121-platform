import { TestBed } from '@automock/jest';
import { HttpException, HttpStatus } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaginateConfig } from 'nestjs-paginate';
import { Repository } from 'typeorm';

import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { ProgramService } from '@121-service/src/programs/programs.service';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { PaginateQueryLimitRequired } from '@121-service/src/shared/types/paginate-query-limit-required.type';
import { generateMockCreateQueryBuilder } from '@121-service/src/utils/test-helpers/createQueryBuilderMock.helper';

const mockPaginate = jest.fn();
jest.mock('nestjs-paginate', () => ({
  ...jest.requireActual('nestjs-paginate'),
  paginate: (...args) => mockPaginate(...args),
}));

describe('RegistrationsPaginationService', () => {
  let service: RegistrationsPaginationService;
  let programService: ProgramService;
  let registrationViewScopedRepository: RegistrationViewScopedRepository;
  let programRepository: Repository<ProgramEntity>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(
      RegistrationsPaginationService,
    ).compile();

    service = unit;
    programService = unitRef.get(ProgramService);
    registrationViewScopedRepository = unitRef.get(
      RegistrationViewScopedRepository,
    );
    programRepository = unitRef.get(
      getRepositoryToken(ProgramEntity) as string,
    );
  });

  describe('get registrations', () => {
    const customAttributeName = 'customAttribute';
    const customAttributeValue = 'custom value';
    const customAttributeId = 10;
    const registrationId = 1;

    function mockProgramWithCustomAttribute() {
      const queryBuilder = generateMockCreateQueryBuilder(null, {
        useGetMany: true,
      });
      jest
        .spyOn(programRepository, 'findOneOrFail')
        .mockResolvedValue({ fullnameNamingConvention: [] } as any);
      jest
        .spyOn(registrationViewScopedRepository, 'addProgramFilter')
        .mockReturnValue(queryBuilder as any);
      jest.spyOn(programService, 'getAllRelationProgram').mockResolvedValue([
        {
          name: customAttributeName,
          type: RegistrationAttributeTypes.text,
          relation: { programRegistrationAttributeId: customAttributeId },
        },
      ]);
      return queryBuilder;
    }

    // Only returns the attribute data when the data relation is requested, like the database would
    function mockPaginateRespectingRelations() {
      mockPaginate.mockImplementation(
        (_query, _queryBuilder, config: PaginateConfig<any>) => {
          const registration: Record<string, unknown> = {
            id: registrationId,
            referenceId: 'reference-id',
          };
          if (config.relations && 'data' in config.relations) {
            registration.data = [
              {
                programRegistrationAttributeId: customAttributeId,
                value: customAttributeValue,
              },
            ];
          }
          return Promise.resolve({ data: [registration], meta: {} });
        },
      );
    }

    function getPaginateConfigRelations() {
      const [, , config] = mockPaginate.mock.calls[0];
      return config.relations;
    }

    async function getPaginateWithSelect({
      select,
      hasPersonalReadPermission,
    }: {
      select: string[];
      hasPersonalReadPermission: boolean;
    }) {
      const queryBuilder = mockProgramWithCustomAttribute();
      mockPaginateRespectingRelations();
      return service.getPaginate({
        query: { path: 'test', limit: 10, select },
        programId: 1,
        hasPersonalReadPermission,
        queryBuilder: queryBuilder as any,
      });
    }

    beforeEach(() => {
      mockPaginate.mockReset();
    });

    it('should not join attribute data when only a root field is selected', async () => {
      // Act
      const result = await getPaginateWithSelect({
        select: ['id'],
        hasPersonalReadPermission: true,
      });

      // Assert
      expect(getPaginateConfigRelations()).toEqual({});
      expect(result.data).toEqual([{ id: registrationId }]);
    });

    it('should join attribute data and return its value when the custom attribute is selected', async () => {
      // Act
      const result = await getPaginateWithSelect({
        select: [customAttributeName],
        hasPersonalReadPermission: true,
      });

      // Assert
      expect(getPaginateConfigRelations()).toEqual({ data: true });
      expect(result.data).toEqual([
        { [customAttributeName]: customAttributeValue },
      ]);
    });

    it('should not join attribute data without personal read permission', async () => {
      // Act
      const result = await getPaginateWithSelect({
        select: [customAttributeName],
        hasPersonalReadPermission: false,
      });

      // Assert
      expect(getPaginateConfigRelations()).toEqual({});
      expect(result.data).toEqual([{}]);
    });

    it('should throw BAD_REQUEST when sortByKey is an array', async () => {
      const queryBuilder = generateMockCreateQueryBuilder(null, {
        useGetMany: true,
      });

      jest
        .spyOn(programRepository, 'findOneOrFail')
        .mockResolvedValue({ fullnameNamingConvention: [] } as any);

      jest
        .spyOn(registrationViewScopedRepository, 'addProgramFilter')
        .mockReturnValue(queryBuilder as any);

      jest.spyOn(programService, 'getAllRelationProgram').mockResolvedValue([]);

      const query: PaginateQueryLimitRequired = {
        path: 'test',
        limit: 10,
        sortBy: [[['column1', 'column2'], 'ASC']] as any,
      };

      await expect(
        service.getPaginate({
          query,
          programId: 1,
          hasPersonalReadPermission: true,
          queryBuilder: queryBuilder as any,
        }),
      ).rejects.toThrow(
        new HttpException(
          'Multi-column sort is not supported',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });
  });
});
