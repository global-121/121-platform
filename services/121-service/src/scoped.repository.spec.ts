/* eslint-disable @typescript-eslint/no-unused-vars */
import { TestBed } from '@automock/jest';
import { DataSource } from 'typeorm';
import { RegistrationDataEntity } from './registration/registration-data.entity';
import { ScopedRepository } from './scoped.repository';
import { getDataSourceMock } from './utils/unit-test.helpers';

describe('ScopedRepository', () => {
  let scopedRepository: ScopedRepository<RegistrationDataEntity>;
  let datasource: jest.Mocked<DataSource>;

  beforeEach(() => {
    const { unit: scopedRepositoryUnit, unitRef: scopedRepositoryUnitRef } =
      TestBed.create(ScopedRepository<RegistrationDataEntity>)
        .mock(DataSource)
        .using(getDataSourceMock('RegistrationDataEntity'))
        .compile();

    scopedRepository = scopedRepositoryUnit;
    datasource = scopedRepositoryUnitRef.get(DataSource);
  });

  it('should be defined', () => {
    // Normally we omit test files that just test 'should be defined'. Leaving this in here now, so the set-up is not lost.
    // An actual relevant test to still add is to check if .where is correctly prohibited
    expect(scopedRepository).toBeDefined();
  });
});
