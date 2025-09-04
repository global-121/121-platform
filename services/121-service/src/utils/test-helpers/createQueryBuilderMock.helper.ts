interface QueryBuilderMock {
  where: () => QueryBuilderMock;
  andWhere: () => QueryBuilderMock;
  select: () => QueryBuilderMock;
  addSelect: () => QueryBuilderMock;
  leftJoin: () => QueryBuilderMock;
  getMany?: () => unknown;
  getRawMany?: () => unknown;
  distinct?: () => QueryBuilderMock;
}

export function generateMockCreateQueryBuilder(
  dbQueryResult?: unknown[] | null,
  options: { useGetMany?: boolean } = {},
): QueryBuilderMock {
  const mock: QueryBuilderMock = {
    select: () => mock,
    addSelect: () => mock,
    where: () => mock,
    andWhere: () => mock,
    leftJoin: () => mock,
    distinct: () => mock,
  };

  if (options.useGetMany) {
    mock.getMany = () => dbQueryResult;
  } else {
    mock.getRawMany = () => dbQueryResult;
  }

  return mock;
}
