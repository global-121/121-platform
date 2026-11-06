import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

export function addScopeFilter({
  queryBuilder,
  registrationAlias,
  programAlias,
  scope,
}: {
  queryBuilder: SelectQueryBuilder<ObjectLiteral>;
  registrationAlias: string;
  programAlias: string;
  scope: string;
}): void {
  queryBuilder.andWhere(
    `("${programAlias}"."enableScope" = false OR "${registrationAlias}"."scope" LIKE :scope)`,
    { scope: `${scope}%` },
  );
}
