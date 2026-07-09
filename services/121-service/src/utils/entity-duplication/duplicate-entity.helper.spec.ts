import { RelationMetadata } from 'typeorm/metadata/RelationMetadata';

import {
  buildRelationLoadTree,
  cloneColumns,
  getNestedRelationTree,
  getRelationChildren,
  getRelationNamesToDuplicate,
  isSelectedForDuplication,
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

describe('cloneColumns', () => {
  it('should skip primary columns', () => {
    const metadata = makeMetadata([makeColumn('id', { isPrimary: true })]);
    const result = cloneColumns({ metadata, source: { id: 1 }, overrides: {} });
    expect(result).not.toHaveProperty('id');
  });

  it('should skip audit columns (created, updated, version)', () => {
    const metadata = makeMetadata([
      makeColumn('created', { isCreateDate: true }),
      makeColumn('updated', { isUpdateDate: true }),
      makeColumn('version', { isVersion: true }),
    ]);
    const result = cloneColumns({
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
    const result = cloneColumns({
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
    const result = cloneColumns({
      metadata,
      source: { userId: 7 },
      overrides: {},
      excludeForeignKeyColumns: true,
    });
    expect(result).toHaveProperty('userId', 7);
  });

  it('should skip columns set to false in propertiesToDuplicate', () => {
    const metadata = makeMetadata([makeColumn('title')]);
    const result = cloneColumns({
      metadata,
      source: { title: 'Test' },
      overrides: {},
      propertiesToDuplicate: { title: false },
    });
    expect(result).not.toHaveProperty('title');
  });

  it('should copy columns set to true in propertiesToDuplicate', () => {
    const metadata = makeMetadata([makeColumn('title')]);
    const result = cloneColumns({
      metadata,
      source: { title: 'Test' },
      overrides: {},
      propertiesToDuplicate: { title: true },
    });
    expect(result).toHaveProperty('title', 'Test');
  });

  it('should apply overrides for known column names', () => {
    const metadata = makeMetadata([makeColumn('currency')]);
    const result = cloneColumns({
      metadata,
      source: { currency: 'EUR' },
      overrides: { currency: 'USD' },
    });
    expect(result).toHaveProperty('currency', 'USD');
  });

  it('should ignore overrides for keys that are not column property names', () => {
    const metadata = makeMetadata([makeColumn('title')]);
    const result = cloneColumns({
      metadata,
      source: { title: 'Test' },
      overrides: { nonExistentKey: 'value' },
    });
    expect(result).not.toHaveProperty('nonExistentKey');
  });

  it('should skip columns absent from source', () => {
    const metadata = makeMetadata([makeColumn('description')]);
    const result = cloneColumns({
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
    }); // not one-to-many or one-to-one
    expect(() =>
      validateRelationTypeOrThrow({ relation, relationName: 'roles' }),
    ).toThrow('only one-to-many and one-to-one relations');
  });
});

describe('getRelationChildren', () => {
  it('should return the related array for one-to-many relation', () => {
    const relation = makeRelation({ isOneToMany: true });
    const children = [{ id: 1 }, { id: 2 }];
    const result = getRelationChildren({ relation, related: children });
    expect(result).toBe(children);
  });

  it('should return empty array for one-to-many when related is null', () => {
    const relation = makeRelation({ isOneToMany: true });
    const result = getRelationChildren({ relation, related: null });
    expect(result).toHaveLength(0);
  });

  it('should wrap a single object in an array for one-to-one relation', () => {
    const relation = makeRelation({ isOneToOne: true });
    const child = { id: 5 };
    const result = getRelationChildren({ relation, related: child });
    expect(result).toEqual([child]);
  });

  it('should return empty array for one-to-one when related is null', () => {
    const relation = makeRelation({ isOneToOne: true });
    const result = getRelationChildren({ relation, related: null });
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

describe('isSelectedForDuplication', () => {
  it('should select when value is true', () => {
    expect(isSelectedForDuplication(true)).toBe(true);
  });

  it('should select when value is a nested tree', () => {
    expect(isSelectedForDuplication({ properties: true })).toBe(true);
  });

  it('should not select when value is false', () => {
    expect(isSelectedForDuplication(false)).toBe(false);
  });
});

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

describe('buildRelationLoadTree', () => {
  it('should load a relation flagged true as a leaf', () => {
    const metadata = makeEntityMetadata([
      makeRelationWithChildren({ propertyName: 'attachments' }),
    ]);

    const result = buildRelationLoadTree({
      metadata,
      relationTree: { attachments: true },
    });

    expect(result).toEqual({ attachments: true });
  });

  it('should also load a child many-to-many relation for re-linking', () => {
    const metadata = makeEntityMetadata([
      makeRelationWithChildren({
        propertyName: 'aidworkerAssignments',
        childRelations: [{ propertyName: 'roles', isManyToMany: true }],
      }),
    ]);

    const result = buildRelationLoadTree({
      metadata,
      relationTree: { aidworkerAssignments: true },
    });

    expect(result).toEqual({ aidworkerAssignments: { roles: true } });
  });

  it('should recurse into nested relations flagged for duplication', () => {
    const metadata = makeEntityMetadata([
      makeRelationWithChildren({
        propertyName: 'programFspConfigurations',
        childRelations: [makeRelationWithChildren({ propertyName: 'properties' })],
      }),
    ]);

    const result = buildRelationLoadTree({
      metadata,
      relationTree: { programFspConfigurations: { properties: true } },
    });

    expect(result).toEqual({
      programFspConfigurations: { properties: true },
    });
  });
});
