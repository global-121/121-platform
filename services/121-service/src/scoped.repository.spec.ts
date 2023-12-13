/* eslint-disable @typescript-eslint/no-unused-vars */
import { TestBed } from '@automock/jest';
import { ScopedQueryBuilder, ScopedRepository } from './scoped.repository';
import { DataSource, QueryBuilder, SelectQueryBuilder } from 'typeorm';
import { RegistrationDataEntity } from './registration/registration-data.entity';
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
    // Leaving this in here for now so the set-up is not lost
    expect(scopedRepository).toBeDefined();
  });
});
