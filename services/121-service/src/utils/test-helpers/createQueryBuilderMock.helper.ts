interface QueryBuilderMock {
  where: () => QueryBuilderMock;
  andWhere: () => QueryBuilderMock;
  select: () => QueryBuilderMock;
  addSelect: () => QueryBuilderMock;
  leftJoin: () => QueryBuilderMock;
  getMany?: () => any;
  getRawMany?: () => any;
  distinct?: () => QueryBuilderMock;
  orderBy?: () => QueryBuilderMock;
}

export function generateMockCreateQueryBuilder(
  dbQueryResult?: any[] | null,
  options: { useGetMany?: boolean } = {},
): QueryBuilderMock {
  const mock: QueryBuilderMock = {
    select: () => mock,
    addSelect: () => mock,
    where: () => mock,
    andWhere: () => mock,
    leftJoin: () => mock,
    distinct: () => mock,
    orderBy: () => mock,
  };

  if (options.useGetMany) {
    mock.getMany = () => dbQueryResult;
  } else {
    mock.getRawMany = () => dbQueryResult;
  }

  return mock;
}
