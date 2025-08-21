import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';

import { env } from '@121-service/src/env';
import { indirectRelationConfig } from '@121-service/src/scoped.repository';

@ApiTags('development')
@Controller('development')
export class DevelopmentController {
  constructor(private readonly dataSource: DataSource) {}

  @Get('validate-indirect-relations')
  validateIndirectRelations(): {
    status: string;
    message?: string;
    details?: Record<string, string[]>;
  } {
    if (env.NODE_ENV !== 'development') {
      return { status: 'disabled', message: 'Only available in development' };
    }

    try {
      const missing = this.performExhaustivenessCheck();
      if (Object.keys(missing).length > 0) {
        const missingDetails = Object.entries(missing)
          .map(
            ([entity, path]) =>
              `${entity}: [${path.map((p) => `'${p}'`).join(', ')}]`,
          )
          .join('\n  ');

        console.error(
          'Missing entities in indirectRelationConfig:',
          missingDetails,
        );

        return {
          status: 'error',
          message: `Missing entities in indirectRelationConfig:\n  ${missingDetails}`,
          details: missing,
        };
      }

      return { status: 'success' };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('Validation error:', errorMessage);

      return {
        status: 'error',
        message: errorMessage,
      };
    }
  }

  private performExhaustivenessCheck(): Record<string, string[]> {
    const entityMetas = this.dataSource.entityMetadatas;
    const graph = this.buildRelationGraphWithTypes(entityMetas);
    const missing: Record<string, string[]> = {};

    for (const meta of entityMetas) {
      const entityName = meta.name;
      if (entityName === 'RegistrationEntity') continue;

      const direct = Object.values(graph[entityName] || {}).some(
        (rel) => rel.target === 'RegistrationEntity',
      );
      if (direct) continue;

      const path = this.findPathToRegistrationFiltered(entityName, graph);
      if (path && !(entityName in indirectRelationConfig)) {
        missing[entityName] = path;
      }
    }

    return missing;
  }

  private buildRelationGraphWithTypes(
    entityMetas: {
      name: string;
      relations: {
        propertyName: string;
        inverseEntityMetadata: { name: string };
        isManyToOne: boolean;
        isOneToMany: boolean;
        isOneToOne: boolean;
      }[];
    }[],
  ): Record<string, Record<string, { target: string; type: string }>> {
    const graph: Record<
      string,
      Record<string, { target: string; type: string }>
    > = {};

    for (const meta of entityMetas) {
      graph[meta.name] = {};
      for (const rel of meta.relations) {
        let type: string;
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

  private findPathToRegistrationFiltered(
    entity: string,
    graph: Record<string, Record<string, { target: string; type: string }>>,
    visited = new Set<string>(),
    path: string[] = [],
  ): string[] | null {
    if (entity === 'RegistrationEntity') return path;
    if (visited.has(entity)) return null;

    visited.add(entity);

    for (const [prop, rel] of Object.entries(graph[entity] || {})) {
      if (rel.type === 'one-to-many') {
        continue;
      }

      const result = this.findPathToRegistrationFiltered(
        rel.target,
        graph,
        visited,
        [...path, prop],
      );
      if (result) return result;
    }
    return null;
  }
}
