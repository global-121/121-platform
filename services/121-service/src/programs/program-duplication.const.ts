import { EntityDuplicationTree } from '@121-service/src/utils/entity-duplication/duplicate-entity.service';

export const relationsToDuplicate: EntityDuplicationTree = {
  aidworkerAssignments: true,
  programFspConfigurations: {
    properties: true,
  },
  programApprovalThresholds: true,
};
