/* eslint-disable @typescript-eslint/no-unused-vars */
import { RegistrationDataEntity } from '@121-service/src/registration/registration-data.entity';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { TestBed } from '@automock/jest';

describe('ScopedRepository', () => {
  let scopedRepository: ScopedRepository<RegistrationDataEntity>;

  beforeEach(() => {
    const { unit: scopedRepositoryUnit, unitRef: scopedRepositoryUnitRef } =
      TestBed.create(ScopedRepository<RegistrationDataEntity>).compile();

    scopedRepository = scopedRepositoryUnit;
  });

  it('should be defined', () => {
    // Normally we omit test files that just test 'should be defined'. Leaving this in here now, so the set-up is not lost.
    // An actual relevant test to still add is to check if .where is correctly prohibited
    expect(scopedRepository).toBeDefined();
  });
});
