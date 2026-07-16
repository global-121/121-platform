import {
  DataSource,
  DeepPartial,
  EntityManager,
  EntityMetadata,
  EntityTarget,
  Equal,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
} from 'typeorm';

import {
  buildRelationsToEagerLoad,
  collectLateralForeignKeyRemaps,
  copyColumnValues,
  DuplicationContext,
  EntityDuplicationTree,
  getNestedRelationTree,
  getParentForeignKeyProperty,
  getPrimaryKeyProperty,
  getRelationNamesToDuplicate,
  normalizeRelationChildren,
  validateRelationTypeOrThrow,
} from '@121-service/src/utils/entity-duplication/duplicate-entity.helper';

export type { EntityDuplicationTree };

/**
 * Copies the selected relations of an already-existing source row onto an
 * already-existing target row of the same entity type.
 *
 * The target root is expected to be created by the caller (e.g. via the normal
 * create flow). This helper only duplicates the configured relation children
 * (recursing into nested relation trees) and re-points foreign keys that
 * reference another duplicated sibling.
 */
export async function duplicateRelations<T extends ObjectLiteral>({
  dataSource,
  entity,
  sourceId,
  targetId,
  relationsToDuplicate,
}: {
  dataSource: DataSource;
  entity: EntityTarget<T>;
  sourceId: number;
  targetId: number;
  relationsToDuplicate: EntityDuplicationTree;
}): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.startTransaction();

  try {
    const repository = queryRunner.manager.getRepository(entity);
    const metadata = repository.metadata;

    const context: DuplicationContext = {
      idMapByEntityName: new Map(),
      duplicatedRows: [],
    };

    const primaryColumn = getPrimaryKeyProperty(metadata);
    const source = await repository.findOneOrFail({
      where: { [primaryColumn]: Equal(sourceId) } as FindOptionsWhere<T>,
      relations: buildRelationsToEagerLoad<T>({
        metadata,
        relationTree: relationsToDuplicate,
      }),
    });

    // The target root already exists; record the source -> target id mapping so
    // that any relation foreign key pointing at the root can be remapped.
    getOrCreateIdMap(context, metadata.name).set(sourceId, targetId);

    await duplicateEntityRelations({
      manager: queryRunner.manager,
      metadata,
      source,
      newParentId: targetId,
      relationTree: relationsToDuplicate,
      context,
    });

    await remapLateralForeignKeys({ manager: queryRunner.manager, context });

    await queryRunner.commitTransaction();
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
// Copy-relations phase: duplicate each selected relation's children,
// recursing into nested relation trees.
// ---------------------------------------------------------------------------

async function duplicateEntityRelations({
  manager,
  metadata,
  source,
  newParentId,
  relationTree,
  context,
}: {
  manager: EntityManager;
  metadata: EntityMetadata;
  source: ObjectLiteral;
  newParentId: number;
  relationTree: EntityDuplicationTree;
  context: DuplicationContext;
}): Promise<void> {
  const relationNamesToDuplicate = getRelationNamesToDuplicate({
    metadata,
    relationTree,
  });
  for (const relationName of relationNamesToDuplicate) {
    await duplicateRelationChildren({
      manager,
      metadata,
      relationName,
      source,
      newParentId,
      nestedTree: getNestedRelationTree(relationTree[relationName]),
      context,
    });
  }
}

async function duplicateRelationChildren({
  manager,
  metadata,
  relationName,
  source,
  newParentId,
  nestedTree,
  context,
}: {
  manager: EntityManager;
  metadata: EntityMetadata;
  relationName: string;
  source: ObjectLiteral;
  newParentId: number;
  nestedTree?: EntityDuplicationTree;
  context: DuplicationContext;
}): Promise<void> {
  const relation = metadata.findRelationWithPropertyPath(relationName);

  if (!relation) {
    throw new Error(`Relation "${relationName}" not found on ${metadata.name}`);
  }

  const inverseRelation = validateRelationTypeOrThrow({
    relation,
    relationName,
  });

  const relationData = source[relationName];
  const children = normalizeRelationChildren({ relation, relationData });

  if (children.length === 0) {
    return;
  }

  const childMetadata = relation.inverseEntityMetadata;
  const childRepository = manager.getRepository(childMetadata.target);
  const parentForeignKeyProperty = getParentForeignKeyProperty(inverseRelation);

  const copies = children.map((child) =>
    buildChildCopy({
      child,
      childMetadata,
      childRepository,
      parentForeignKeyProperty,
      newParentId,
    }),
  );

  const savedCopies = await childRepository.save(copies);

  for (const [index, child] of children.entries()) {
    recordDuplicatedRow({
      context,
      metadata: childMetadata,
      source: child,
      copy: savedCopies[index],
      parentForeignKeyProperty,
    });
  }

  if (nestedTree) {
    await duplicateNestedRelationTrees({
      manager,
      children,
      savedCopies,
      childMetadata,
      nestedTree,
      context,
    });
  }
}

async function duplicateNestedRelationTrees({
  manager,
  children,
  savedCopies,
  childMetadata,
  nestedTree,
  context,
}: {
  manager: EntityManager;
  children: ObjectLiteral[];
  savedCopies: ObjectLiteral[];
  childMetadata: EntityMetadata;
  nestedTree: EntityDuplicationTree;
  context: DuplicationContext;
}): Promise<void> {
  const childPrimaryKey = getPrimaryKeyProperty(childMetadata);

  for (const [index, child] of children.entries()) {
    await duplicateEntityRelations({
      manager,
      metadata: childMetadata,
      source: child,
      newParentId: savedCopies[index][childPrimaryKey],
      relationTree: nestedTree,
      context,
    });
  }
}

function buildChildCopy({
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
  const childColumns = copyColumnValues({
    metadata: childMetadata,
    source: child,
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
// Remap phase: re-point foreign keys that reference another duplicated entity.
// ---------------------------------------------------------------------------

function recordDuplicatedRow({
  context,
  metadata,
  source,
  copy,
  parentForeignKeyProperty,
}: {
  context: DuplicationContext;
  metadata: EntityMetadata;
  source: ObjectLiteral;
  copy: ObjectLiteral;
  parentForeignKeyProperty?: string;
}): void {
  context.duplicatedRows.push({
    metadata,
    source,
    copy,
    parentForeignKeyProperty,
  });

  const primaryKey = getPrimaryKeyProperty(metadata);

  getOrCreateIdMap(context, metadata.name).set(
    source[primaryKey],
    copy[primaryKey],
  );
}

function getOrCreateIdMap(
  context: DuplicationContext,
  entityName: string,
): Map<unknown, unknown> {
  let idMap = context.idMapByEntityName.get(entityName);

  if (!idMap) {
    idMap = new Map();
    context.idMapByEntityName.set(entityName, idMap);
  }

  return idMap;
}

async function remapLateralForeignKeys({
  manager,
  context,
}: {
  manager: EntityManager;
  context: DuplicationContext;
}): Promise<void> {
  for (const row of context.duplicatedRows) {
    const remappedForeignKeys = collectLateralForeignKeyRemaps({
      row,
      context,
    });

    if (remappedForeignKeys.size === 0) {
      continue;
    }

    const repository = manager.getRepository(row.metadata.target);
    const primaryKey = getPrimaryKeyProperty(row.metadata);
    await repository.update(
      row.copy[primaryKey],
      Object.fromEntries(remappedForeignKeys),
    );
  }
}
