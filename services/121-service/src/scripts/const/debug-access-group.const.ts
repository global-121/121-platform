import { DebugAccessGroupHierarchy } from '@121-service/src/scripts/enum/debug-access-group-hierarchy.enum';
import type { AssignedAccessGroupDto } from '@121-service/src/user/dto/assigned-access-group.dto';

interface DebugAccessGroupHierarchyDefinition {
  readonly registrationAttributeNames: readonly string[];
  // Paths to the lowest access group level; the higher levels are derived from these
  readonly leafPaths: readonly string[];
}

const ACCESS_GROUP_PATH_SEPARATOR = '/';

const DEBUG_ACCESS_GROUP_HIERARCHIES = new Map<
  DebugAccessGroupHierarchy,
  DebugAccessGroupHierarchyDefinition
>([
  [
    DebugAccessGroupHierarchy.netherlands,
    {
      registrationAttributeNames: ['province', 'municipality'],
      leafPaths: [
        'noord-holland/haarlem',
        'noord-holland/amsterdam',
        'noord-holland/alkmaar',
        'noord-holland/hoorn',
        'zuid-holland/rotterdam',
        'zuid-holland/den-haag',
        'zuid-holland/leiden',
        'zuid-holland/delft',
        'utrecht/utrecht',
        'utrecht/amersfoort',
        'utrecht/zeist',
        'utrecht/veenendaal',
        'gelderland/arnhem',
        'gelderland/nijmegen',
        'gelderland/apeldoorn',
        'gelderland/ede',
        'noord-brabant/eindhoven',
        'noord-brabant/tilburg',
        'noord-brabant/breda',
        'noord-brabant/s-hertogenbosch',
      ],
    },
  ],
]);

export function getDebugAccessGroupRegistrationAttributeNames({
  hierarchy,
}: {
  hierarchy: DebugAccessGroupHierarchy;
}): string[] {
  return [...getHierarchyDefinition({ hierarchy }).registrationAttributeNames];
}

export function getDebugAccessGroupLeafPaths({
  hierarchy,
}: {
  hierarchy: DebugAccessGroupHierarchy;
}): string[] {
  return [...getHierarchyDefinition({ hierarchy }).leafPaths];
}

export function findDebugAccessGroupHierarchy({
  registrationAttributeNames,
}: {
  registrationAttributeNames: string[];
}): DebugAccessGroupHierarchy | undefined {
  for (const [hierarchy, definition] of DEBUG_ACCESS_GROUP_HIERARCHIES) {
    if (
      definition.registrationAttributeNames.join() ===
      registrationAttributeNames.join()
    ) {
      return hierarchy;
    }
  }
}

// Ordered from the highest level down, so higher level users are created first
export function getDebugAccessGroupPaths({
  hierarchy,
}: {
  hierarchy: DebugAccessGroupHierarchy;
}): string[] {
  const { registrationAttributeNames, leafPaths } = getHierarchyDefinition({
    hierarchy,
  });
  const paths = new Set<string>();

  for (let depth = 1; depth <= registrationAttributeNames.length; depth++) {
    for (const leafPath of leafPaths) {
      paths.add(
        leafPath
          .split(ACCESS_GROUP_PATH_SEPARATOR)
          .slice(0, depth)
          .join(ACCESS_GROUP_PATH_SEPARATOR),
      );
    }
  }

  return [...paths];
}

export function getAccessGroupValuesByAttributeName({
  hierarchy,
  path,
}: {
  hierarchy: DebugAccessGroupHierarchy;
  path: string;
}): Map<string, string> {
  return new Map(
    getAccessGroupAssignments({ hierarchy, path }).map(
      ({ programRegistrationAttributeName, value }) => [
        programRegistrationAttributeName,
        value,
      ],
    ),
  );
}

export function getAccessGroupAssignments({
  hierarchy,
  path,
}: {
  hierarchy: DebugAccessGroupHierarchy;
  path: string;
}): AssignedAccessGroupDto[] {
  const { registrationAttributeNames } = getHierarchyDefinition({ hierarchy });

  return path.split(ACCESS_GROUP_PATH_SEPARATOR).map((value, levelIndex) => {
    const programRegistrationAttributeName =
      registrationAttributeNames[levelIndex];
    if (!programRegistrationAttributeName) {
      throw new Error(`Unexpected access group level in "${path}"`);
    }

    return {
      programRegistrationAttributeName,
      value,
    };
  });
}

function getHierarchyDefinition({
  hierarchy,
}: {
  hierarchy: DebugAccessGroupHierarchy;
}): DebugAccessGroupHierarchyDefinition {
  const definition = DEBUG_ACCESS_GROUP_HIERARCHIES.get(hierarchy);
  if (!definition) {
    throw new Error(`Unknown debug access group hierarchy "${hierarchy}"`);
  }

  return definition;
}
