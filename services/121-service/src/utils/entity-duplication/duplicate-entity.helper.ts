import { EntityMetadata, FindOptionsRelations, ObjectLiteral } from 'typeorm';
import { RelationMetadata } from 'typeorm/metadata/RelationMetadata';

/**
 * Describes which columns and relations of an entity should be duplicated,
 * mirroring the shape of TypeORM's `FindOptionsRelations`.
 *
 * - `true` duplicates the column, or the relation's direct children.
 * - `false` skips it.
 * - A nested tree duplicates the relation AND recurses into the listed
 *   sub-relations (e.g. `{ properties: true }`).
 */
export interface EntityDuplicationTree {
  [propertyName: string]: boolean | EntityDuplicationTree;
}

export interface DuplicatedRow {
  metadata: EntityMetadata;
  source: ObjectLiteral;
  copy: ObjectLiteral;
  parentForeignKeyProperty?: string;
}

export interface DuplicationContext {
  readonly idMapByEntityName: Map<string, Map<unknown, unknown>>;
  readonly duplicatedRows: DuplicatedRow[];
}

// ---------------------------------------------------------------------------
// Load phase: decide which relations to eager-load from the source entity.
// ---------------------------------------------------------------------------

export function buildRelationsToEagerLoad<T extends ObjectLiteral>({
  metadata,
  relationTree,
}: {
  metadata: EntityMetadata;
  relationTree: EntityDuplicationTree;
}): FindOptionsRelations<T> {
  const tree: Record<string, boolean | Record<string, unknown>> = {};
  const relationNamesToDuplicate = getRelationNamesToDuplicate({
    metadata,
    relationTree,
  });

  for (const relationName of relationNamesToDuplicate) {
    const relation = metadata.findRelationWithPropertyPath(relationName);

    if (!relation) {
      continue;
    }

    const manyToManySubRelations = getManyToManySubRelations({ relation });
    const nestedTree = getNestedRelationTree(relationTree[relationName]);
    const nestedLoad = nestedTree
      ? buildRelationsToEagerLoad({
          metadata: relation.inverseEntityMetadata,
          relationTree: nestedTree,
        })
      : {};
    const mergedSubRelations = { ...manyToManySubRelations, ...nestedLoad };

    tree[relationName] =
      Object.keys(mergedSubRelations).length > 0 ? mergedSubRelations : true;
  }
  return tree as FindOptionsRelations<T>;
}

function getManyToManySubRelations({
  relation,
}: {
  relation: RelationMetadata;
}): Record<string, boolean> {
  const manyToManySubRelations: Record<string, boolean> = {};

  for (const childRelation of relation.inverseEntityMetadata.relations) {
    if (childRelation.isManyToMany) {
      manyToManySubRelations[childRelation.propertyName] = true;
    }
  }

  return manyToManySubRelations;
}

// ---------------------------------------------------------------------------
// Copy-columns phase: copy the entity's own column values.
// ---------------------------------------------------------------------------

/**
 * Copies a source row's own persistable column values so the row can be cloned.
 *
 * Skips identity/audit columns and nullable foreign keys: the parent foreign
 * key is set by the caller and lateral foreign keys are re-pointed afterwards.
 */
export function copyColumnValues({
  metadata,
  source,
}: {
  metadata: EntityMetadata;
  source: ObjectLiteral;
}): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const column of metadata.columns) {
    const propertyName = column.propertyName;

    if (isPrimaryOrAuditColumn(column)) {
      continue;
    }
    if (isNullableForeignKeyColumn(column)) {
      continue;
    }
    if (!(propertyName in source)) {
      continue;
    }

    result[propertyName] = source[propertyName];
  }

  return result;
}

function isPrimaryOrAuditColumn(column: {
  isPrimary: boolean;
  isCreateDate: boolean;
  isUpdateDate: boolean;
  isVersion: boolean;
}): boolean {
  return (
    column.isPrimary ||
    column.isCreateDate ||
    column.isUpdateDate ||
    column.isVersion
  );
}

function isNullableForeignKeyColumn(column: {
  relationMetadata?: unknown;
  isNullable: boolean;
}): boolean {
  return Boolean(column.relationMetadata) && column.isNullable;
}

// ---------------------------------------------------------------------------
// Remap phase: collect foreign keys that reference another duplicated entity.
// ---------------------------------------------------------------------------

export function collectLateralForeignKeyRemaps({
  row,
  context,
}: {
  row: DuplicatedRow;
  context: DuplicationContext;
}): Map<string, unknown> {
  const remappedForeignKeys = new Map<string, unknown>();

  for (const relation of row.metadata.relations) {
    const foreignKeyProperty = getOwnedForeignKeyProperty(relation);

    if (!foreignKeyProperty || isParentForeignKey({ foreignKeyProperty, row })) {
      continue;
    }

    const idMapForTarget = context.idMapByEntityName.get(
      relation.inverseEntityMetadata.name,
    );
    const oldForeignKey = row.source[foreignKeyProperty];
    const newForeignKey = idMapForTarget?.get(oldForeignKey);

    if (newForeignKey !== undefined) {
      remappedForeignKeys.set(foreignKeyProperty, newForeignKey);
    }
  }

  return remappedForeignKeys;
}

function isParentForeignKey({
  foreignKeyProperty,
  row,
}: {
  foreignKeyProperty: string;
  row: DuplicatedRow;
}): boolean {
  return foreignKeyProperty === row.parentForeignKeyProperty;
}

function getOwnedForeignKeyProperty(
  relation: RelationMetadata,
): string | undefined {
  if (!relation.isManyToOne && !relation.isOneToOne) {
    return undefined;
  }
  return relation.joinColumns[0]?.propertyName;
}

// ---------------------------------------------------------------------------
// Leaf predicates and metadata readers.
// ---------------------------------------------------------------------------

export function getRelationNamesToDuplicate({
  metadata,
  relationTree,
}: {
  metadata: EntityMetadata;
  relationTree: EntityDuplicationTree;
}): string[] {
  return metadata.relations
    .map((relation) => relation.propertyName)
    .filter((propertyName) =>
      isSelectedForDuplication(relationTree[propertyName]),
    );
}

function isSelectedForDuplication(
  value: boolean | EntityDuplicationTree | undefined,
): boolean {
  return value === true || isRelationTree(value);
}

export function getNestedRelationTree(
  value: boolean | EntityDuplicationTree | undefined,
): EntityDuplicationTree | undefined {
  return isRelationTree(value) ? value : undefined;
}

function isRelationTree(
  value: boolean | EntityDuplicationTree | undefined,
): value is EntityDuplicationTree {
  return typeof value === 'object' && value !== null;
}

export function validateRelationTypeOrThrow({
  relation,
  relationName,
}: {
  relation: RelationMetadata;
  relationName: string;
}): RelationMetadata {
  if (
    (!relation.isOneToMany && !relation.isOneToOne) ||
    !relation.inverseRelation
  ) {
    throw new Error(
      `Duplication of relation "${relationName}" is not supported: only one-to-many and one-to-one relations with an inverse side can be duplicated`,
    );
  }
  return relation.inverseRelation;
}

export function normalizeRelationChildren({
  relation,
  relationData,
}: {
  relation: RelationMetadata;
  relationData: unknown;
}): ObjectLiteral[] {
  if (!relationData) {
    return [];
  }
  if (relation.isOneToMany) {
    return relationData as ObjectLiteral[];
  }
  return [relationData as ObjectLiteral];
}

export function getPrimaryKeyProperty(metadata: EntityMetadata): string {
  return metadata.primaryColumns[0].propertyName;
}

export function getParentForeignKeyProperty(
  inverseRelation: RelationMetadata,
): string {
  return inverseRelation.joinColumns[0].propertyName;
}
