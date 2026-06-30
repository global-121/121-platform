import { HttpException, HttpStatus } from '@nestjs/common';
import {
  DeepPartial,
  EntityManager,
  EntityMetadata,
  EntityTarget,
  Equal,
  FindOptionsRelations,
  FindOptionsWhere,
  ObjectLiteral,
} from 'typeorm';

import { getRelationsToDuplicate } from '@121-service/src/utils/entity-duplication/duplicate-relation.decorator';

/**
 * Generic, metadata-driven entity duplication.
 *
 * Loads the entity with the given id, creates a copy of its columns (resetting
 * the primary key and audit columns), applies the provided overrides, and then
 * copies every relation that was marked with `@DuplicateRelation()` on the
 * entity, re-pointing each child at the new parent.
 *
 * Scope (POC): only one-to-many relations can be duplicated. Many-to-many
 * relations on the copied children (e.g. roles) are re-linked to the existing
 * targets rather than cloned. Foreign keys other than the parent reference are
 * preserved as-is.
 *
 * Must be called with a transactional `EntityManager` so that the copy is
 * atomic.
 */
export async function duplicateEntity<T extends ObjectLiteral>({
  manager,
  entity,
  id,
  overrides = {},
}: {
  manager: EntityManager;
  entity: EntityTarget<T>;
  id: number;
  overrides?: Record<string, unknown>;
}): Promise<T> {
  const repository = manager.getRepository(entity);
  const metadata = repository.metadata;
  const relationNames = getRelationNamesToDuplicate(metadata);

  const primaryColumn = metadata.primaryColumns[0].propertyName;
  const source = await repository.findOne({
    where: { [primaryColumn]: Equal(id) } as FindOptionsWhere<T>,
    relations: buildRelationLoadTree<T>({ metadata, relationNames }),
  });
  if (!source) {
    throw new HttpException(
      { errors: `No ${metadata.name} found with id ${id}` },
      HttpStatus.NOT_FOUND,
    );
  }

  const newRoot = await repository.save(
    repository.create(
      cloneColumns({ metadata, source, overrides }) as DeepPartial<T>,
    ),
  );
  const newRootId = newRoot[primaryColumn];

  for (const relationName of relationNames) {
    await copyOneToManyRelation({
      manager,
      metadata,
      relationName,
      source,
      newParentId: newRootId,
    });
  }

  return newRoot;
}

function getRelationNamesToDuplicate(metadata: EntityMetadata): string[] {
  const target = metadata.target;
  return typeof target === 'function' ? getRelationsToDuplicate(target) : [];
}

function buildRelationLoadTree<T extends ObjectLiteral>({
  metadata,
  relationNames,
}: {
  metadata: EntityMetadata;
  relationNames: string[];
}): FindOptionsRelations<T> {
  const tree: Record<string, boolean | Record<string, boolean>> = {};
  for (const relationName of relationNames) {
    const relation = metadata.findRelationWithPropertyPath(relationName);
    if (!relation) {
      continue;
    }
    // Also load the children's many-to-many relations so they can be re-linked.
    const manyToManySubRelations: Record<string, boolean> = {};
    for (const childRelation of relation.inverseEntityMetadata.relations) {
      if (childRelation.isManyToMany) {
        manyToManySubRelations[childRelation.propertyName] = true;
      }
    }
    tree[relationName] =
      Object.keys(manyToManySubRelations).length > 0
        ? manyToManySubRelations
        : true;
  }
  return tree as FindOptionsRelations<T>;
}

function cloneColumns({
  metadata,
  source,
  overrides,
}: {
  metadata: EntityMetadata;
  source: ObjectLiteral;
  overrides: Record<string, unknown>;
}): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const column of metadata.columns) {
    if (
      column.isPrimary ||
      column.isCreateDate ||
      column.isUpdateDate ||
      column.isVersion
    ) {
      continue;
    }
    const propertyName = column.propertyName;
    if (!(propertyName in source)) {
      // Column was not selected (e.g. `select: false`); let the default apply.
      continue;
    }
    result[propertyName] = source[propertyName];
  }

  const columnPropertyNames = new Set(
    metadata.columns.map((column) => column.propertyName),
  );
  for (const [key, value] of Object.entries(overrides)) {
    if (columnPropertyNames.has(key)) {
      result[key] = value;
    }
  }
  return result;
}

async function copyOneToManyRelation({
  manager,
  metadata,
  relationName,
  source,
  newParentId,
}: {
  manager: EntityManager;
  metadata: EntityMetadata;
  relationName: string;
  source: ObjectLiteral;
  newParentId: unknown;
}): Promise<void> {
  const relation = metadata.findRelationWithPropertyPath(relationName);
  if (!relation) {
    throw new Error(`Relation "${relationName}" not found on ${metadata.name}`);
  }
  if (!relation.isOneToMany || !relation.inverseRelation) {
    throw new Error(
      `Duplication of relation "${relationName}" is not supported: only one-to-many relations can be duplicated`,
    );
  }

  const children = (source[relationName] ?? []) as ObjectLiteral[];
  if (children.length === 0) {
    return;
  }

  const childMetadata = relation.inverseEntityMetadata;
  const childRepository = manager.getRepository(childMetadata.target);
  const parentForeignKeyProperty =
    relation.inverseRelation.joinColumns[0].propertyName;

  const copies = children.map((child) => {
    const childColumns = cloneColumns({
      metadata: childMetadata,
      source: child,
      overrides: {},
    });
    childColumns[parentForeignKeyProperty] = newParentId;

    // Re-link many-to-many relations (e.g. roles) instead of cloning targets.
    for (const childRelation of childMetadata.relations) {
      if (childRelation.isManyToMany && child[childRelation.propertyName]) {
        childColumns[childRelation.propertyName] =
          child[childRelation.propertyName];
      }
    }
    return childRepository.create(childColumns as DeepPartial<ObjectLiteral>);
  });

  await childRepository.save(copies);
}
