import { RelationMetadata } from 'typeorm/metadata/RelationMetadata';

import {
  buildRelationsToEagerLoad,
  collectLateralForeignKeyRemaps,
  copyColumnValues,
  getNestedRelationTree,
  getRelationNamesToDuplicate,
  normalizeRelationChildren,
  validateRelationTypeOrThrow,
} from '@121-service/src/utils/entity-duplication/duplicate-entity.helper';

// Helpers to build minimal column/relation mocks without implementing
// the full TypeORM metadata interfaces.
function makeColumn(
  propertyName: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    isPrimary: false,
    isCreateDate: false,
    isUpdateDate: false,
    isVersion: false,
    propertyName,
    relationMetadata: null,
    isNullable: false,
    ...overrides,
  };
}

function makeMetadata(columns: ReturnType<typeof makeColumn>[]) {
  return { columns } as any;
}

function makeRelation(
  overrides: Partial<RelationMetadata> = {},
): RelationMetadata {
  return {
    isOneToMany: false,
    isOneToOne: false,
    inverseRelation: undefined,
    ...overrides,
     
  } as any;
}

describe('copyColumnValues', () => {
  it('should skip primary columns', () => {
    const metadata = makeMetadata([makeColumn('id', { isPrimary: true })]);
    const result = copyColumnValues({ metadata, source: { id: 1 }, overrides: {} });
    expect(result).not.toHaveProperty('id');
  });

  it('should skip audit columns (created, updated, version)', () => {
    const metadata = makeMetadata([
      makeColumn('created', { isCreateDate: true }),
      makeColumn('updated', { isUpdateDate: true }),
      makeColumn('version', { isVersion: true }),
    ]);
    const result = copyColumnValues({
      metadata,
      source: { created: new Date(), updated: new Date(), version: 1 },
      overrides: {},
    });
    expect(result).not.toHaveProperty('created');
    expect(result).not.toHaveProperty('updated');
    expect(result).not.toHaveProperty('version');
  });

  it('should skip nullable FK columns when excludeForeignKeyColumns is true', () => {
    const metadata = makeMetadata([
      makeColumn('programId', { relationMetadata: {}, isNullable: true }),
    ]);
    const result = copyColumnValues({
      metadata,
      source: { programId: 42 },
      overrides: {},
      excludeForeignKeyColumns: true,
    });
    expect(result).not.toHaveProperty('programId');
  });

  it('should keep non-nullable FK columns even when excludeForeignKeyColumns is true', () => {
    const metadata = makeMetadata([
      makeColumn('userId', { relationMetadata: {}, isNullable: false }),
    ]);
    const result = copyColumnValues({
      metadata,
      source: { userId: 7 },
      overrides: {},
      excludeForeignKeyColumns: true,
    });
    expect(result).toHaveProperty('userId', 7);
  });

  it('should skip columns set to false in propertiesToDuplicate', () => {
    const metadata = makeMetadata([makeColumn('title')]);
    const result = copyColumnValues({
      metadata,
      source: { title: 'Test' },
      overrides: {},
      propertiesToDuplicate: { title: false },
    });
    expect(result).not.toHaveProperty('title');
  });

  it('should copy columns set to true in propertiesToDuplicate', () => {
    const metadata = makeMetadata([makeColumn('title')]);
    const result = copyColumnValues({
      metadata,
      source: { title: 'Test' },
      overrides: {},
      propertiesToDuplicate: { title: true },
    });
    expect(result).toHaveProperty('title', 'Test');
  });

  it('should apply overrides for known column names', () => {
    const metadata = makeMetadata([makeColumn('currency')]);
    const result = copyColumnValues({
      metadata,
      source: { currency: 'EUR' },
      overrides: { currency: 'USD' },
    });
    expect(result).toHaveProperty('currency', 'USD');
  });

  it('should ignore overrides for keys that are not column property names', () => {
    const metadata = makeMetadata([makeColumn('title')]);
    const result = copyColumnValues({
      metadata,
      source: { title: 'Test' },
      overrides: { nonExistentKey: 'value' },
    });
    expect(result).not.toHaveProperty('nonExistentKey');
  });

  it('should skip columns absent from source', () => {
    const metadata = makeMetadata([makeColumn('description')]);
    const result = copyColumnValues({
      metadata,
      source: {},
      overrides: {},
    });
    expect(result).not.toHaveProperty('description');
  });
});

describe('validateRelationTypeOrThrow', () => {
  it('should return inverseRelation for one-to-many relation', () => {
    const inverseRelation = {
      joinColumns: [{ propertyName: 'programId' }],
    } as RelationMetadata;
    const relation = makeRelation({ isOneToMany: true, inverseRelation });
    const result = validateRelationTypeOrThrow({ relation, relationName: 'items' });
    expect(result).toBe(inverseRelation);
  });

  it('should return inverseRelation for one-to-one relation', () => {
    const inverseRelation = {
      joinColumns: [{ propertyName: 'koboId' }],
    } as RelationMetadata;
    const relation = makeRelation({ isOneToOne: true, inverseRelation });
    const result = validateRelationTypeOrThrow({ relation, relationName: 'kobo' });
    expect(result).toBe(inverseRelation);
  });

  it('should throw for one-to-many relation without an inverse side', () => {
    const relation = makeRelation({
      isOneToMany: true,
      inverseRelation: undefined,
    });
    expect(() =>
      validateRelationTypeOrThrow({ relation, relationName: 'items' }),
    ).toThrow('"items"');
  });

  it('should throw for unsupported relation types (e.g. many-to-many)', () => {
    const relation = makeRelation({
      inverseRelation: {} as RelationMetadata,
    });
    expect(() =>
      validateRelationTypeOrThrow({ relation, relationName: 'roles' }),
    ).toThrow('only one-to-many and one-to-one relations');
  });
});

describe('normalizeRelationChildren', () => {
  it('should return the related array for one-to-many relation', () => {
    const relation = makeRelation({ isOneToMany: true });
    const children = [{ id: 1 }, { id: 2 }];
    const result = normalizeRelationChildren({
      relation,
      relationData: children,
    });
    expect(result).toBe(children);
  });

  it('should return empty array for one-to-many when related is null', () => {
    const relation = makeRelation({ isOneToMany: true });
    const result = normalizeRelationChildren({
      relation,
      relationData: null,
    });
    expect(result).toHaveLength(0);
  });

  it('should wrap a single object in an array for one-to-one relation', () => {
    const relation = makeRelation({ isOneToOne: true });
    const child = { id: 5 };
    const result = normalizeRelationChildren({
      relation,
      relationData: child,
    });
    expect(result).toEqual([child]);
  });

  it('should return empty array for one-to-one when related is null', () => {
    const relation = makeRelation({ isOneToOne: true });
    const result = normalizeRelationChildren({
      relation,
      relationData: null,
    });
    expect(result).toHaveLength(0);
  });
});

// Builds a minimal EntityMetadata-like stub exposing only the members the
// tree-interpretation helpers use: the relation list and lookup by name.
function makeEntityMetadata(relations: any[]): any {
  return {
    relations,
    findRelationWithPropertyPath: (name: string) =>
      relations.find((relation) => relation.propertyName === name) ?? null,
  };
}

function makeRelationWithChildren({
  propertyName,
  isManyToMany = false,
  childRelations = [],
}: {
  propertyName: string;
  isManyToMany?: boolean;
  childRelations?: any[];
}): { propertyName: string; isManyToMany: boolean; inverseEntityMetadata: any } {
  return {
    propertyName,
    isManyToMany,
    inverseEntityMetadata: makeEntityMetadata(childRelations),
  };
}

describe('getNestedRelationTree', () => {
  it('should return the tree when value is a nested object', () => {
    const nested = { properties: true };
    expect(getNestedRelationTree(nested)).toBe(nested);
  });

  it('should return undefined when value is true', () => {
    expect(getNestedRelationTree(true)).toBeUndefined();
  });
});

describe('getRelationNamesToDuplicate', () => {
  it('should select relations flagged true or with a nested tree', () => {
    const metadata = makeEntityMetadata([
      { propertyName: 'aidworkerAssignments' },
      { propertyName: 'registrations' },
      { propertyName: 'programFspConfigurations' },
    ]);

    const result = getRelationNamesToDuplicate({
      metadata,
      relationTree: {
        aidworkerAssignments: true,
        registrations: false,
        programFspConfigurations: { properties: true },
      },
    });

    expect(result).toEqual([
      'aidworkerAssignments',
      'programFspConfigurations',
    ]);
  });

  it('should ignore column flags that do not match a relation', () => {
    const metadata = makeEntityMetadata([{ propertyName: 'attachments' }]);

    const result = getRelationNamesToDuplicate({
      metadata,
      relationTree: { location: true, attachments: true },
    });

    expect(result).toEqual(['attachments']);
  });
});

describe('buildRelationsToEagerLoad', () => {
  it('should keep only selected relations and drop unselected ones and column flags', () => {
    const metadata = makeEntityMetadata([
      makeRelationWithChildren({ propertyName: 'attachments' }),
      makeRelationWithChildren({ propertyName: 'registrations' }),
    ]);

    const result = buildRelationsToEagerLoad({
      metadata,
      relationTree: {
        attachments: true, // selected relation -> loaded as a leaf
        registrations: false, // unselected relation -> dropped
        location: true, // a column, not a relation -> ignored
      },
    });

    expect(result).toEqual({ attachments: true });
  });

  it("should auto-load a child's many-to-many relation that is not in the config", () => {
    const metadata = makeEntityMetadata([
      makeRelationWithChildren({
        propertyName: 'aidworkerAssignments',
        childRelations: [{ propertyName: 'roles', isManyToMany: true }],
      }),
    ]);

    const result = buildRelationsToEagerLoad({
      metadata,
      relationTree: { aidworkerAssignments: true },
    });

    // `roles` is never in the config; it is added so it can be re-linked.
    expect(result).toEqual({ aidworkerAssignments: { roles: true } });
  });

  it('should recurse into a nested relation and drop unselected sub-relations', () => {
    const metadata = makeEntityMetadata([
      makeRelationWithChildren({
        propertyName: 'programFspConfigurations',
        childRelations: [
          makeRelationWithChildren({ propertyName: 'properties' }),
          makeRelationWithChildren({ propertyName: 'transactionEvents' }),
        ],
      }),
    ]);

    const result = buildRelationsToEagerLoad({
      metadata,
      relationTree: {
        programFspConfigurations: {
          properties: true, // selected -> kept
          transactionEvents: false, // unselected -> dropped inside the nested tree
        },
      },
    });

    expect(result).toEqual({
      programFspConfigurations: { properties: true },
    });
  });
});

// Builds a minimal owning foreign key relation (many-to-one) referencing
// another entity by name.
function makeForeignKeyRelation({
  foreignKeyProperty,
  targetEntityName,
}: {
  foreignKeyProperty: string;
  targetEntityName: string;
}): any {
  return {
    isManyToOne: true,
    isOneToOne: false,
    joinColumns: [{ propertyName: foreignKeyProperty }],
    inverseEntityMetadata: { name: targetEntityName },
  };
}

// Builds a minimal duplicated-row stub for the remap pass.
function makeRow({
  relations,
  source,
  parentForeignKeyProperty,
}: {
  relations: any[];
  source: Record<string, unknown>;
  parentForeignKeyProperty?: string;
}): any {
  return {
    metadata: { relations },
    source,
    copy: {},
    parentForeignKeyProperty,
  };
}

// Builds a duplication context from a map of entity name -> (old id -> new id).
function makeContext(
  idMapsByEntityName: Record<string, Map<unknown, unknown>>,
): any {
  return {
    idMapByEntityName: new Map(Object.entries(idMapsByEntityName)),
    duplicatedRows: [],
  };
}

describe('collectLateralForeignKeyRemaps', () => {
  it('should remap a foreign key that points at a duplicated sibling', () => {
    const row = makeRow({
      relations: [
        makeForeignKeyRelation({
          foreignKeyProperty: 'programApprovalThresholdId',
          targetEntityName: 'ProgramApprovalThresholdEntity',
        }),
      ],
      source: { programApprovalThresholdId: 10 },
      parentForeignKeyProperty: 'programId',
    });
    const context = makeContext({
      ProgramApprovalThresholdEntity: new Map([[10, 100]]),
    });

    const result = collectLateralForeignKeyRemaps({ row, context });

    expect(Object.fromEntries(result)).toEqual({
      programApprovalThresholdId: 100,
    });
  });

  it('should skip the parent foreign key', () => {
    const row = makeRow({
      relations: [
        makeForeignKeyRelation({
          foreignKeyProperty: 'programId',
          targetEntityName: 'ProgramEntity',
        }),
      ],
      source: { programId: 1 },
      parentForeignKeyProperty: 'programId',
    });
    const context = makeContext({ ProgramEntity: new Map([[1, 2]]) });

    const result = collectLateralForeignKeyRemaps({ row, context });

    expect(result.size).toBe(0);
  });

  it('should keep a foreign key that points at a non-duplicated entity', () => {
    const row = makeRow({
      relations: [
        makeForeignKeyRelation({
          foreignKeyProperty: 'userId',
          targetEntityName: 'UserEntity',
        }),
      ],
      source: { userId: 7 },
    });
    const context = makeContext({}); // UserEntity was not duplicated

    const result = collectLateralForeignKeyRemaps({ row, context });

    expect(result.size).toBe(0);
  });

  it('should skip a null foreign key', () => {
    const row = makeRow({
      relations: [
        makeForeignKeyRelation({
          foreignKeyProperty: 'programApprovalThresholdId',
          targetEntityName: 'ProgramApprovalThresholdEntity',
        }),
      ],
      source: { programApprovalThresholdId: null },
    });
    const context = makeContext({
      ProgramApprovalThresholdEntity: new Map([[10, 100]]),
    });

    const result = collectLateralForeignKeyRemaps({ row, context });

    expect(result.size).toBe(0);
  });

  it('should skip when the referenced row itself was not duplicated', () => {
    const row = makeRow({
      relations: [
        makeForeignKeyRelation({
          foreignKeyProperty: 'programApprovalThresholdId',
          targetEntityName: 'ProgramApprovalThresholdEntity',
        }),
      ],
      source: { programApprovalThresholdId: 999 },
    });
    const context = makeContext({
      ProgramApprovalThresholdEntity: new Map([[10, 100]]),
    });

    const result = collectLateralForeignKeyRemaps({ row, context });

    expect(result.size).toBe(0);
  });

  it('should ignore relations that are not the owning side of a single-value relation', () => {
    const row = makeRow({
      relations: [{ isManyToOne: false, isOneToOne: false, joinColumns: [] }],
      source: {},
    });
    const context = makeContext({});

    const result = collectLateralForeignKeyRemaps({ row, context });

    expect(result.size).toBe(0);
  });
});
