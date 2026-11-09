import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

import { AssignedAccessGroupResult } from '@121-service/src/programs/access-group-levels/interfaces/assigned-access-group-result.interface';
import { RegistrationAttributeDataEntity } from '@121-service/src/registration/entities/registration-attribute-data.entity';

// Access groups are inferred from registration attribute data at query time, using an EXISTS subquery per access group the user is assigned to
// A subquery keeps the attribute data alias out of the outer query, so callers cannot run into ambiguous column names
export function addAccessGroupFilter({
  queryBuilder,
  registrationAlias,
  accessGroups,
}: {
  queryBuilder: SelectQueryBuilder<ObjectLiteral>;
  registrationAlias: string;
  accessGroups: AssignedAccessGroupResult[];
}): void {
  if (accessGroups.length === 0) {
    return;
  }

  const accessGroupConditions: string[] = [];
  const parameters: Record<string, string | number> = {};
  let index = 0;
  for (const accessGroup of accessGroups) {
    index = getNextAvailableAccessGroupParameterIndex({
      queryBuilder,
      startIndex: index,
    });

    const dataAlias = `accessGroupData${index}`;
    const attributeParameterName = `accessGroupAttributeId${index}`;
    const valueParameterName = `accessGroupValue${index}`;

    const subQuery = queryBuilder
      .subQuery()
      .select('1')
      .from(RegistrationAttributeDataEntity, dataAlias)
      .andWhere(`"${dataAlias}"."registrationId" = "${registrationAlias}"."id"`)
      .andWhere(
        `"${dataAlias}"."programRegistrationAttributeId" = :${attributeParameterName}`,
      )
      .andWhere(`"${dataAlias}"."value" = :${valueParameterName}`);

    accessGroupConditions.push(`EXISTS ${subQuery.getQuery()}`);
    parameters[attributeParameterName] =
      accessGroup.programRegistrationAttributeId;
    parameters[valueParameterName] = accessGroup.value;
    index++;
  }

  queryBuilder.andWhere(accessGroupConditions.join(' AND '), parameters);
}

function getNextAvailableAccessGroupParameterIndex({
  queryBuilder,
  startIndex,
}: {
  queryBuilder: SelectQueryBuilder<ObjectLiteral>;
  startIndex: number;
}): number {
  let index = startIndex;
  while (
    queryBuilder.hasParameter(`accessGroupAttributeId${index}`) ||
    queryBuilder.hasParameter(`accessGroupValue${index}`)
  ) {
    index++;
  }

  return index;
}
