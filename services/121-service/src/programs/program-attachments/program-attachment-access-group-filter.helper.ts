import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

import { AssignedAccessGroupResult } from '@121-service/src/programs/access-group-levels/interfaces/assigned-access-group-result.interface';
import { ProgramAttachmentAccessGroupEntity } from '@121-service/src/programs/program-attachments/program-attachment-access-group.entity';

// Every access group of the user has to be part of the access groups stored on the attachment.
// So users higher up in the hierarchy can access attachments lower in their branch, but not the other way around.
// A user without access groups is not restricted, and an attachment without access groups is only accessible to unrestricted users.
export function addProgramAttachmentAccessGroupFilter({
  queryBuilder,
  attachmentAlias,
  accessGroups,
}: {
  queryBuilder: SelectQueryBuilder<ObjectLiteral>;
  attachmentAlias: string;
  accessGroups: readonly AssignedAccessGroupResult[];
}): void {
  if (accessGroups.length === 0) {
    return;
  }

  const accessGroupConditions: string[] = [];
  const parameters: Record<string, string | number> = {};
  for (const [index, accessGroup] of accessGroups.entries()) {
    const accessGroupAlias = `attachmentAccessGroup${index}`;
    const levelParameterName = `attachmentAccessGroupLevelId${index}`;
    const valueParameterName = `attachmentAccessGroupValue${index}`;

    const subQuery = queryBuilder
      .subQuery()
      .select('1')
      .from(ProgramAttachmentAccessGroupEntity, accessGroupAlias)
      .andWhere(
        `"${accessGroupAlias}"."programAttachmentId" = "${attachmentAlias}"."id"`,
      )
      .andWhere(
        `"${accessGroupAlias}"."accessGroupLevelId" = :${levelParameterName}`,
      )
      .andWhere(`"${accessGroupAlias}"."value" = :${valueParameterName}`);

    accessGroupConditions.push(`EXISTS ${subQuery.getQuery()}`);
    parameters[levelParameterName] = accessGroup.accessGroupLevelId;
    parameters[valueParameterName] = accessGroup.value;
  }

  queryBuilder.andWhere(accessGroupConditions.join(' AND '), parameters);
}
