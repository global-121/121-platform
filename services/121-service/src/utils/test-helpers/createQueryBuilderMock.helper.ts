interface QueryBuilderMock {
  where: () => QueryBuilderMock;
  andWhere: () => QueryBuilderMock;
  select: () => QueryBuilderMock;
  addSelect: () => QueryBuilderMock;
  leftJoin: () => QueryBuilderMock;
  getMany?: () => any;
  getRawMany?: () => any;
  getRawOne?: () => any;
  distinct?: () => QueryBuilderMock;
  orderBy?: () => QueryBuilderMock;
}

export function generateMockCreateQueryBuilder(
  dbQueryResult?: any,
  options: { useGetMany?: boolean; useGetRawOne?: boolean } = {},
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
  } else if (options.useGetRawOne) {
    mock.getRawOne = () => dbQueryResult;
  } else {
    mock.getRawMany = () => dbQueryResult;
  }

  return mock;
}
