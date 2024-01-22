import { generateMockCreateQueryBuilder } from './createQueryBuilderMock.helper';

describe('generateMockCreateQueryBuilder', () => {
  const dbQueryResult = [{ name: 'username', value: '1234' }];

  it('includes select and getRawMany when configured', () => {
    const options = { includeSelect: true };
    const mockQueryBuilder = generateMockCreateQueryBuilder(
      dbQueryResult,
      options,
    );

    expect(mockQueryBuilder.select).toBeDefined();
    expect(mockQueryBuilder.getRawMany()).toEqual(dbQueryResult);
    expect(mockQueryBuilder.getMany).toBeUndefined();
  });

  it('includes addSelect and leftJoin with getMany', () => {
    const options = {
      includeAddSelect: true,
      includeLeftJoin: true,
      useGetMany: true,
    };
    const mockQueryBuilder = generateMockCreateQueryBuilder(
      dbQueryResult,
      options,
    );

    expect(mockQueryBuilder.addSelect).toBeDefined();
    expect(mockQueryBuilder.leftJoin).toBeDefined();
    expect(mockQueryBuilder.getMany()).toEqual(dbQueryResult);
    expect(mockQueryBuilder.getRawMany).toBeUndefined();
  });

  it('allows chaining of defined methods', () => {
    const options = {
      includeWhere: true,
      includeAndWhere: true,
      useGetMany: true,
    };
    const mockQueryBuilder = generateMockCreateQueryBuilder(
      dbQueryResult,
      options,
    );

    // Simulate method chaining
    const result = mockQueryBuilder.where().andWhere().getMany();

    expect(result).toEqual(dbQueryResult);
  });
});
