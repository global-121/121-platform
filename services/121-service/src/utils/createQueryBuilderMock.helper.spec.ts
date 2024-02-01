import { generateMockCreateQueryBuilder } from './createQueryBuilderMock.helper';

describe('generateMockCreateQueryBuilder', () => {
  const dbQueryResult = [{ name: 'username', value: '1234' }];

  it('should define select, addSelect, and leftJoin methods and successfully return dbQueryResult using getRawMany', () => {
    const mockQueryBuilder = generateMockCreateQueryBuilder(dbQueryResult);

    expect(mockQueryBuilder.select).toBeDefined();
    expect(mockQueryBuilder.addSelect).toBeDefined();
    expect(mockQueryBuilder.leftJoin).toBeDefined();
    expect(mockQueryBuilder.getRawMany()).toEqual(dbQueryResult);
    expect(mockQueryBuilder.getMany).toBeUndefined();
  });

  it('should define select, addSelect, and leftJoin methods and successfully return dbQueryResult using getMany', () => {
    const options = {
      useGetMany: true,
    };
    const mockQueryBuilder = generateMockCreateQueryBuilder(
      dbQueryResult,
      options,
    );

    expect(mockQueryBuilder.select).toBeDefined();
    expect(mockQueryBuilder.addSelect).toBeDefined();
    expect(mockQueryBuilder.leftJoin).toBeDefined();
    expect(mockQueryBuilder.getMany()).toEqual(dbQueryResult);
    expect(mockQueryBuilder.getRawMany).toBeUndefined();
  });
});
