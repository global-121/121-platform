// Registry of relation property names that should be copied when an entity is
// duplicated, keyed by the entity class (constructor). It is populated as a
// side effect of the `@DuplicateRelation()` decorators being evaluated when the
// entity modules are loaded.
const relationsToDuplicateByEntity = new Map<object, Set<string>>();

/**
 * Marks a relation property so the generic `duplicateEntity` helper copies it
 * along when the owning entity is duplicated. Place it on the inverse relation
 * declared on the parent entity (e.g. `ProgramEntity.aidworkerAssignments`).
 */
export function DuplicateRelation(): PropertyDecorator {
  return (target: object, propertyKey: string | symbol): void => {
    const relationNames =
      relationsToDuplicateByEntity.get(target.constructor) ??
      new Set<string>();
    relationNames.add(propertyKey.toString());
    relationsToDuplicateByEntity.set(target.constructor, relationNames);
  };
}

/**
 * Returns the relation property names that were marked with
 * `@DuplicateRelation()` on the given entity class.
 */
export function getRelationsToDuplicate(entityConstructor: object): string[] {
  return [...(relationsToDuplicateByEntity.get(entityConstructor) ?? [])];
}
