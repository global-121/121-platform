import {
  DataSource,
  DeepPartial,
  EntityManager,
  EntityMetadata,
  EntityTarget,
  Equal,
  FindOptionsRelations,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
} from 'typeorm';
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

export async function duplicateEntity<T extends ObjectLiteral>({
  dataSource,
  entity,
  id,
  propertiesToDuplicate,
  overrides = {},
}: {
  dataSource: DataSource;
  entity: EntityTarget<T>;
  id: number;
  propertiesToDuplicate: EntityDuplicationTree;
  overrides?: Record<string, unknown>;
}): Promise<T> {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.startTransaction();

  try {
    const repository = queryRunner.manager.getRepository(entity);
    const metadata = repository.metadata;

    const primaryColumn = getPrimaryKeyProperty(metadata);
    const source = await repository.findOneOrFail({
      where: { [primaryColumn]: Equal(id) } as FindOptionsWhere<T>,
      relations: buildRelationLoadTree<T>({
        metadata,
        relationTree: propertiesToDuplicate,
      }),
    });

    const newRoot = await repository.save(
      repository.create(
        cloneColumns({
          metadata,
          source,
          overrides,
          propertiesToDuplicate,
        }) as DeepPartial<T>,
      ),
    );
    const newRootId = newRoot[primaryColumn];

    await duplicateRelations({
      manager: queryRunner.manager,
      metadata,
      source,
      newParentId: newRootId,
      relationTree: propertiesToDuplicate,
    });

    await queryRunner.commitTransaction();
    return newRoot;
  } catch (error) {
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }
    throw error;
  } finally {
    await queryRunner.release();
  }
}

// ---------------------------------------------------------------------------
// Load phase: decide which relations to eager-load from the source entity.
// ---------------------------------------------------------------------------

export function buildRelationLoadTree<T extends ObjectLiteral>({
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
      ? buildRelationLoadTree({
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
// Clone-root phase: copy the entity's own columns.
// ---------------------------------------------------------------------------

export function cloneColumns({
  metadata,
  source,
  overrides,
  propertiesToDuplicate,
  excludeForeignKeyColumns = false,
}: {
  metadata: EntityMetadata;
  source: ObjectLiteral;
  overrides: Record<string, unknown>;
  propertiesToDuplicate?: EntityDuplicationTree;
  excludeForeignKeyColumns?: boolean;
}): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const column of metadata.columns) {
    if (isPrimaryOrAuditColumn(column)) {
      continue;
    }

    const propertyName = column.propertyName;

    if (
      excludeForeignKeyColumns &&
      column.relationMetadata &&
      column.isNullable
    ) {
      continue;
    }

    if (propertiesToDuplicate && propertiesToDuplicate[propertyName] !== true) {
      continue;
    }

    if (!(propertyName in source)) {
      continue;
    }

    result[propertyName] = source[propertyName];
  }

  applyColumnOverrides({ result, overrides, metadata });
  return result;
}

function applyColumnOverrides({
  result,
  overrides,
  metadata,
}: {
  result: Record<string, unknown>;
  overrides: Record<string, unknown>;
  metadata: EntityMetadata;
}): void {
  const columnPropertyNames = metadata.columns.map(
    (column) => column.propertyName,
  );
  for (const [key, value] of Object.entries(overrides)) {
    if (columnPropertyNames.includes(key)) {
      result[key] = value;
    }
  }
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

// ---------------------------------------------------------------------------
// Copy-relations phase: duplicate each selected relation's children,
// recursing into nested relation trees.
// ---------------------------------------------------------------------------

async function duplicateRelations({
  manager,
  metadata,
  source,
  newParentId,
  relationTree,
}: {
  manager: EntityManager;
  metadata: EntityMetadata;
  source: ObjectLiteral;
  newParentId: unknown;
  relationTree: EntityDuplicationTree;
}): Promise<void> {
  const relationNamesToDuplicate = getRelationNamesToDuplicate({
    metadata,
    relationTree,
  });
  for (const relationName of relationNamesToDuplicate) {
    await copyRelation({
      manager,
      metadata,
      relationName,
      source,
      newParentId,
      nestedTree: getNestedRelationTree(relationTree[relationName]),
    });
  }
}

async function copyRelation({
  manager,
  metadata,
  relationName,
  source,
  newParentId,
  nestedTree,
}: {
  manager: EntityManager;
  metadata: EntityMetadata;
  relationName: string;
  source: ObjectLiteral;
  newParentId: unknown;
  nestedTree?: EntityDuplicationTree;
}): Promise<void> {
  const relation = metadata.findRelationWithPropertyPath(relationName);

  if (!relation) {
    throw new Error(`Relation "${relationName}" not found on ${metadata.name}`);
  }

  const inverseRelation = validateRelationTypeOrThrow({
    relation,
    relationName,
  });

  const related = source[relationName];
  const children = getRelationChildren({ relation, related });

  if (children.length === 0) {
    return;
  }

  const childMetadata = relation.inverseEntityMetadata;
  const childRepository = manager.getRepository(childMetadata.target);
  const parentForeignKeyProperty = getForeignKeyProperty(inverseRelation);

  const copies = children.map((child) =>
    createChildCopy({
      child,
      childMetadata,
      childRepository,
      parentForeignKeyProperty,
      newParentId,
    }),
  );

  const savedCopies = await childRepository.save(copies);

  if (nestedTree) {
    await duplicateNestedRelationTrees({
      manager,
      children,
      savedCopies,
      childMetadata,
      nestedTree,
    });
  }
}

async function duplicateNestedRelationTrees({
  manager,
  children,
  savedCopies,
  childMetadata,
  nestedTree,
}: {
  manager: EntityManager;
  children: ObjectLiteral[];
  savedCopies: ObjectLiteral[];
  childMetadata: EntityMetadata;
  nestedTree: EntityDuplicationTree;
}): Promise<void> {
  const childPrimaryKey = getPrimaryKeyProperty(childMetadata);

  for (const [index, child] of children.entries()) {
    await duplicateRelations({
      manager,
      metadata: childMetadata,
      source: child,
      newParentId: savedCopies[index][childPrimaryKey],
      relationTree: nestedTree,
    });
  }
}

function createChildCopy({
  child,
  childMetadata,
  childRepository,
  parentForeignKeyProperty,
  newParentId,
}: {
  child: ObjectLiteral;
  childMetadata: EntityMetadata;
  childRepository: Repository<ObjectLiteral>;
  parentForeignKeyProperty: string;
  newParentId: unknown;
}): ObjectLiteral {
  const childColumns = cloneColumns({
    metadata: childMetadata,
    source: child,
    overrides: {},
    excludeForeignKeyColumns: true,
  });
  childColumns[parentForeignKeyProperty] = newParentId;

  for (const childRelation of childMetadata.relations) {
    if (childRelation.isManyToMany && child[childRelation.propertyName]) {
      childColumns[childRelation.propertyName] =
        child[childRelation.propertyName];
    }
  }

  return childRepository.create(childColumns as DeepPartial<ObjectLiteral>);
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

export function isSelectedForDuplication(
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

export function getRelationChildren({
  relation,
  related,
}: {
  relation: RelationMetadata;
  related: unknown;
}): ObjectLiteral[] {
  if (relation.isOneToMany) {
    return (related ?? []) as ObjectLiteral[];
  }
  if (!related) {
    return [];
  }
  return [related as ObjectLiteral];
}

function getPrimaryKeyProperty(metadata: EntityMetadata): string {
  return metadata.primaryColumns[0].propertyName;
}

function getForeignKeyProperty(inverseRelation: RelationMetadata): string {
  return inverseRelation.joinColumns[0].propertyName;
}
