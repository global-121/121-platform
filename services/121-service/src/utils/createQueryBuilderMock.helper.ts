export interface QueryBuilderMock {
  where: () => QueryBuilderMock;
  andWhere: () => QueryBuilderMock;
  select?: () => QueryBuilderMock;
  addSelect?: () => QueryBuilderMock;
  leftJoin?: () => QueryBuilderMock;
  getMany?: () => any;
  getRawMany?: () => any;
}

export function generateMockCreateQueryBuilder(
  dbQueryResult: any[],
  options: any = {},
): QueryBuilderMock {
  const mock: QueryBuilderMock = {
    where: () => mock,
    andWhere: () => mock,
  };

  if (options.includeSelect) {
    mock.select = () => mock;
  }
  if (options.includeAddSelect) {
    mock.addSelect = () => mock;
  }
  if (options.includeLeftJoin) {
    mock.leftJoin = () => mock;
  }
  if (options.useGetMany) {
    mock.getMany = () => dbQueryResult;
  } else {
    mock.getRawMany = () => dbQueryResult;
  }

  return mock;
}
