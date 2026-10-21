import { HttpStatus } from '@nestjs/common';

import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { AssignedAccessGroupDto } from '@121-service/src/user/dto/assigned-access-group.dto';
import {
  postProgramRegistrationAttribute,
  updateProgramAccessGroupLevels,
} from '@121-service/test/helpers/program.helper';

// Illustrative Dutch administrative divisions, from the highest level down
const ACCESS_GROUP_LEVEL_NAMES = [
  'province',
  'municipality',
  'district',
  'neighbourhood',
] as const;

type AccessGroupLevelName = (typeof ACCESS_GROUP_LEVEL_NAMES)[number];

// Slash-separated values from the highest level down, e.g. 'noord-holland/haarlem/centrum'
export type AccessGroupPath = string;

const ACCESS_GROUP_PATH_SEPARATOR = '/';

// Creates a dropdown attribute per level, with the values used in `paths` as options,
// and configures them as the access group levels of the program
export async function setupAccessGroupLevels({
  programId,
  paths,
  accessToken,
}: {
  programId: number;
  paths: AccessGroupPath[];
  accessToken: string;
}): Promise<void> {
  if (paths.length === 0) {
    throw new Error('Provide at least one path to set up access group levels');
  }

  const splitPaths = paths.map((path) =>
    path.split(ACCESS_GROUP_PATH_SEPARATOR),
  );
  const levelCount = Math.max(...splitPaths.map(({ length }) => length));
  const levelNames = ACCESS_GROUP_LEVEL_NAMES.slice(0, levelCount);

  for (const [levelIndex, levelName] of levelNames.entries()) {
    const optionValues = new Set(
      splitPaths.flatMap((values) => values.slice(levelIndex, levelIndex + 1)),
    );
    const createResponse = await postProgramRegistrationAttribute(
      {
        name: levelName,
        type: RegistrationAttributeTypes.dropdown,
        label: { en: levelName },
        options: [...optionValues].map((option) => ({
          option,
          label: { en: option },
        })),
      },
      programId,
      accessToken,
    );
    if (createResponse.status >= HttpStatus.BAD_REQUEST) {
      throw new Error(
        `Failed to create ${levelName}: ${createResponse.status} - ${JSON.stringify(createResponse.body)}`,
      );
    }
  }

  const updateLevelsResponse = await updateProgramAccessGroupLevels(
    programId,
    { accessGroupRegistrationAttributeNames: levelNames },
    accessToken,
  );
  if (updateLevelsResponse.status >= HttpStatus.BAD_REQUEST) {
    throw new Error(
      `Failed to update access group levels: ${updateLevelsResponse.status} - ${JSON.stringify(updateLevelsResponse.body)}`,
    );
  }
}

// The registration values that put a registration at the path
export function getAccessGroupRegistrationValues({
  path,
}: {
  path: AccessGroupPath;
}): Partial<Record<AccessGroupLevelName, string>> {
  return Object.fromEntries(
    path
      .split(ACCESS_GROUP_PATH_SEPARATOR)
      .map((value, levelIndex) => [
        ACCESS_GROUP_LEVEL_NAMES[levelIndex],
        value,
      ]),
  );
}

// The access groups that give a user access to the registrations at or below the path
export function getAccessGroupAssignments({
  path,
}: {
  path: AccessGroupPath;
}): AssignedAccessGroupDto[] {
  return path.split(ACCESS_GROUP_PATH_SEPARATOR).map((value, levelIndex) => ({
    programRegistrationAttributeName: ACCESS_GROUP_LEVEL_NAMES[levelIndex],
    value,
  }));
}
