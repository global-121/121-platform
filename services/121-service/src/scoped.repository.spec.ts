/* eslint-disable @typescript-eslint/no-unused-vars */
import { RegistrationDataEntity } from '@121-service/src/registration/registration-data.entity';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { getDataSourceMock } from '@121-service/src/utils/unit-test.helpers';
import { TestBed } from '@automock/jest';
import { DataSource } from 'typeorm';

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
