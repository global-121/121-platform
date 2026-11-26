import { HttpException, HttpStatus } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { type Mocked, TestBed } from '@suites/unit';
import { Repository } from 'typeorm';

import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { ProgramService } from '@121-service/src/programs/programs.service';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { PaginateQueryLimitRequired } from '@121-service/src/shared/types/paginate-query-limit-required.type';
import { generateMockCreateQueryBuilder } from '@121-service/src/utils/test-helpers/createQueryBuilderMock.helper';

describe('RegistrationsPaginationService', () => {
  let service: RegistrationsPaginationService;
  let programService: Mocked<ProgramService>;
  let registrationViewScopedRepository: Mocked<RegistrationViewScopedRepository>;
  let programRepository: Mocked<Repository<ProgramEntity>>;

  beforeEach(async () => {
    const { unit, unitRef } = await TestBed.solitary(
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
