import { TestBed } from '@automock/jest';
import { DataSource, EntityMetadata } from 'typeorm';

import { AppDataSource } from '@121-service/src/appdatasource';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationAttributeDataEntity } from '@121-service/src/registration/registration-attribute-data.entity';
import {
  indirectRelationConfig,
  ScopedRepository,
} from '@121-service/src/scoped.repository';

describe('ScopedRepository', () => {
  let scopedRepository: ScopedRepository<RegistrationAttributeDataEntity>;

  beforeEach(() => {
    const { unit: scopedRepositoryUnit } = TestBed.create(
      ScopedRepository<RegistrationAttributeDataEntity>,
    ).compile();

    scopedRepository = scopedRepositoryUnit;
  });

  it('should be defined', () => {
    // Normally we omit test files that just test 'should be defined'. Leaving this in here now, so the set-up is not lost.
    // An actual relevant test to still add is to check if .where is correctly prohibited
    expect(scopedRepository).toBeDefined();
  });

  describe('indirectRelationConfig exhaustiveness', () => {
    let entityMetas: EntityMetadata[];

    beforeAll(async () => {
      const dataSource: DataSource = await AppDataSource.initialize();
      entityMetas = dataSource.entityMetadatas;
    });

    interface RelationInfo {
      target: string;
      type: 'many-to-one' | 'one-to-many' | 'one-to-one' | 'many-to-many';
    }

    function buildRelationGraphWithTypes() {
      const graph: Record<string, Record<string, RelationInfo>> = {};

      for (const meta of entityMetas) {
        graph[meta.name] = {};
        for (const rel of meta.relations) {
          let type: RelationInfo['type'];
          if (rel.isManyToOne) type = 'many-to-one';
          else if (rel.isOneToMany) type = 'one-to-many';
          else if (rel.isOneToOne) type = 'one-to-one';
          else type = 'many-to-many';

          graph[meta.name][rel.propertyName] = {
            target: rel.inverseEntityMetadata.name,
            type,
          };
        }
      }

      return graph;
    }

    function findPathToRegistrationFiltered(
      entity: string,
      graph: Record<string, Record<string, RelationInfo>>,
      visited = new Set<string>(),
      path: string[] = [],
    ): string[] | null {
      if (entity === RegistrationEntity.name) return path;
      if (visited.has(entity)) return null;

      visited.add(entity);

      for (const [prop, rel] of Object.entries(graph[entity] || {})) {
        // 🚫 reject if this hop is OneToMany
        if (rel.type === 'one-to-many') {
          continue;
        }

        const result = findPathToRegistrationFiltered(
          rel.target,
          graph,
          visited,
          [...path, prop],
        );
        if (result) return result;
      }
      return null;
    }

    it('should include all entities with an allowed indirect path to RegistrationEntity', () => {
      const graph = buildRelationGraphWithTypes();
      const missing: Record<string, string[]> = {};

      for (const meta of entityMetas) {
        const entityName = meta.name;
        if (entityName === RegistrationEntity.name) continue;

        // skip if directly related to RegistrationEntity
        const direct = Object.values(graph[entityName] || {}).some(
          (rel) => rel.target === RegistrationEntity.name,
        );
        if (direct) continue;

        const path = findPathToRegistrationFiltered(entityName, graph);
        if (path && !(entityName in indirectRelationConfig)) {
          missing[entityName] = path;
        }
      }

      expect(missing).toEqual({});
    });
  });
});
