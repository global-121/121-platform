import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

import { addAccessGroupFilter } from '@121-service/src/programs/access-group-levels/access-group-filter.helper';

jest.mock('@121-service/src/appdatasource', () => ({
  AppDataSource: {},
}));

describe('Filtering registrations by access groups', () => {
  it('should keep parameter values when filters are added to the same query', () => {
    // Arrange
    const parameters: Record<string, string | number> = {};
    const subQuery = {
      select: () => subQuery,
      from: () => subQuery,
      andWhere: () => subQuery,
      getQuery: () => 'SELECT 1',
    };
    const queryBuilder = {
      hasParameter: (parameterName: string) =>
        Object.hasOwn(parameters, parameterName),
      subQuery: () => subQuery,
      andWhere: (
        _condition: string,
        newParameters: Record<string, string | number>,
      ) => {
        Object.assign(parameters, newParameters);
      },
    } as unknown as SelectQueryBuilder<ObjectLiteral>;

    // Act
    addAccessGroupFilter({
      queryBuilder,
      registrationAlias: 'registration',
      accessGroups: [
        { programRegistrationAttributeId: 1, value: 'north' },
        { programRegistrationAttributeId: 3, value: 'east' },
      ],
    });
    addAccessGroupFilter({
      queryBuilder,
      registrationAlias: 'registration',
      accessGroups: [{ programRegistrationAttributeId: 2, value: 'south' }],
    });

    // Assert
    expect(parameters).toEqual({
      accessGroupAttributeId0: 1,
      accessGroupValue0: 'north',
      accessGroupAttributeId1: 3,
      accessGroupValue1: 'east',
      accessGroupAttributeId2: 2,
      accessGroupValue2: 'south',
    });
  });
});
