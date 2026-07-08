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
  propertiesToDuplicate: Record<string, boolean>;
  overrides?: Record<string, unknown>;
}): Promise<T> {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.startTransaction();

  try {
    const repository = queryRunner.manager.getRepository(entity);
    const metadata = repository.metadata;

    const relationNamesToDuplicate = getRelationNamesToDuplicate({
      metadata,
      propertiesToDuplicate,
    });

    const primaryColumn = metadata.primaryColumns[0].propertyName;
    const source = await repository.findOneOrFail({
      where: { [primaryColumn]: Equal(id) } as FindOptionsWhere<T>,
      relations: buildRelationLoadTree<T>({ metadata, relationNamesToDuplicate }),
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

    for (const relationName of relationNamesToDuplicate) {
      await copyRelation({
        manager: queryRunner.manager,
        metadata,
        relationName,
        source,
        newParentId: newRootId,
      });
    }

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

function getRelationNamesToDuplicate({
  metadata,
  propertiesToDuplicate,
}: {
  metadata: EntityMetadata;
  propertiesToDuplicate: Record<string, boolean>;
}): string[] {
  return metadata.relations
    .map((relation) => relation.propertyName)
    .filter((propertyName) => propertiesToDuplicate[propertyName] === true);
}

function buildRelationLoadTree<T extends ObjectLiteral>({
  metadata,
  relationNamesToDuplicate,
}: {
  metadata: EntityMetadata;
  relationNamesToDuplicate: string[];
}): FindOptionsRelations<T> {
  const tree: Record<string, boolean | Record<string, boolean>> = {};
  for (const relationName of relationNamesToDuplicate) {
    const relation = metadata.findRelationWithPropertyPath(relationName);
    if (!relation) {
      continue;
    }
    // Also load the children's many-to-many relations so they can be re-linked.
    const manyToManySubRelations = getManyToManySubRelations({ relation });
    tree[relationName] =
      Object.keys(manyToManySubRelations).length > 0
        ? manyToManySubRelations
        : true;
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
  propertiesToDuplicate?: Record<string, boolean>;
  excludeForeignKeyColumns?: boolean;
}): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const column of metadata.columns) {
    if (isPrimaryOrAuditColumn(column)) {
      continue;
    }

    const propertyName = column.propertyName;

    if (excludeForeignKeyColumns && column.relationMetadata && column.isNullable) {
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

  const columnPropertyNames = metadata.columns.map((column) => column.propertyName);

  for (const [key, value] of Object.entries(overrides)) {
    if (columnPropertyNames.includes(key)) {
      result[key] = value;
    }
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

async function copyRelation({
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
  const parentForeignKeyProperty = inverseRelation.joinColumns[0].propertyName;

  const copies = children.map((child) =>
    createChildCopy({
      child,
      childMetadata,
      childRepository,
      parentForeignKeyProperty,
      newParentId,
    }),
  );

  await childRepository.save(copies);
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

  // Re-link many-to-many relations (e.g. roles) instead of cloning targets.
  for (const childRelation of childMetadata.relations) {
    if (childRelation.isManyToMany && child[childRelation.propertyName]) {
      childColumns[childRelation.propertyName] =
        child[childRelation.propertyName];
    }
  }
  return childRepository.create(childColumns as DeepPartial<ObjectLiteral>);
}
