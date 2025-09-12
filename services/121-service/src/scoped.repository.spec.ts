import { TestBed } from '@automock/jest';

import { RegistrationAttributeDataEntity } from '@121-service/src/registration/entities/registration-attribute-data.entity';
import { ScopedRepository } from '@121-service/src/scoped.repository';

describe('ScopedRepository', () => {
  let scopedRepository: ScopedRepository<RegistrationAttributeDataEntity>;

  beforeEach(() => {
    const { unit: scopedRepositoryUnit } = TestBed.create(
      ScopedRepository<RegistrationAttributeDataEntity>,
    ).compile();

    scopedRepository = scopedRepositoryUnit;
  });

  it('should be defined', () => {
    // Normally we omit test files that just test 'should be defined'. Leaving this in here now, so the set-up is not lost.
    // An actual relevant test to still add is to check if .where is correctly prohibited
    expect(scopedRepository).toBeDefined();
  });
});
