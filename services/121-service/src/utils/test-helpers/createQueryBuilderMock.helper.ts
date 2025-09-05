interface QueryBuilderMock<T = unknown> {
  where: () => QueryBuilderMock<T>;
  andWhere: () => QueryBuilderMock<T>;
  select: () => QueryBuilderMock<T>;
  addSelect: () => QueryBuilderMock<T>;
  leftJoin: () => QueryBuilderMock<T>;
  getMany?: () => T[];
  getRawMany?: () => T[];
  distinct?: () => QueryBuilderMock<T>;
}

export function generateMockCreateQueryBuilder<T = unknown>(
  dbQueryResult?: T[] | null,
  options: { useGetMany?: boolean } = {},
): QueryBuilderMock<T> {
  const mock: QueryBuilderMock<T> = {
    select: () => mock,
    addSelect: () => mock,
    where: () => mock,
    andWhere: () => mock,
    leftJoin: () => mock,
    distinct: () => mock,
  };

  if (options.useGetMany) {
    mock.getMany = () => dbQueryResult || [];
  } else {
    mock.getRawMany = () => dbQueryResult || [];
  }

  return mock;
}
