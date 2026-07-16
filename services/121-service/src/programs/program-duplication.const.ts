import { EntityDuplicationTree } from '@121-service/src/utils/entity-duplication/duplicate-entity.service';

/**
 * The relations of a program that are copied when duplicating it.
 *
 * The program's own columns are NOT listed here: those are supplied by the
 * (prefilled) create-program request. This config only describes which
 * configuration relations get copied onto the newly created program.
 */
export const relationsToDuplicate: EntityDuplicationTree = {
  aidworkerAssignments: true,
  programFspConfigurations: {
    properties: true,
  },
  programApprovalThresholds: true,
};
