export interface QueryBuilderMock {
  where: () => QueryBuilderMock;
  andWhere: () => QueryBuilderMock;
  select: () => QueryBuilderMock;
  addSelect: () => QueryBuilderMock;
  leftJoin: () => QueryBuilderMock;
  getMany?: () => any;
  getRawMany?: () => any;
}

export function generateMockCreateQueryBuilder(
  dbQueryResult: any[],
  options: any = {},
): QueryBuilderMock {
  const mock: QueryBuilderMock = {
    select: () => mock,
    addSelect: () => mock,
    where: () => mock,
    andWhere: () => mock,
    leftJoin: () => mock,
  };

  if (options.useGetMany) {
    mock.getMany = () => dbQueryResult;
  } else {
    mock.getRawMany = () => dbQueryResult;
  }

  return mock;
}
