import { DebugAccessGroupHierarchy } from '@121-service/src/scripts/enum/debug-access-group-hierarchy.enum';

export interface DebugAccessGroupHierarchyDefinition {
  readonly registrationAttributeNames: readonly string[];
  // Paths to the lowest access group level; the higher levels are derived from these
  readonly leafPaths: readonly string[];
}

export const DEBUG_ACCESS_GROUP_HIERARCHIES = new Map<
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

export function getDebugAccessGroupLeafPaths({
  hierarchy,
}: {
  hierarchy: DebugAccessGroupHierarchy;
}): string[] {
  const definition = DEBUG_ACCESS_GROUP_HIERARCHIES.get(hierarchy);
  if (!definition) {
    throw new Error(`Unknown debug access group hierarchy "${hierarchy}"`);
  }
  return [...definition.leafPaths];
}
