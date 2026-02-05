import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';

import { IS_DEVELOPMENT } from '@121-service/src/config';
import { env } from '@121-service/src/env';
import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { indirectRelationConfig } from '@121-service/src/scoped.repository';
import { SecretDto } from '@121-service/src/scripts/scripts.controller';

@ApiTags('test')
@UseGuards(AuthenticatedUserGuard)
@Controller('test')
export class TestController {
  constructor(private readonly dataSource: DataSource) {}

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary:
      'WARNING: Kills 121-service. Only works in DEBUG-mode. Only used for testing purposes.',
  })
  @ApiExcludeEndpoint(!IS_DEVELOPMENT)
  @Post('kill-service')
  killService(@Body() body: SecretDto, @Res() res): void {
    if (body.secret !== env.RESET_SECRET) {
      return res.status(HttpStatus.FORBIDDEN).send('Not allowed');
    }
    if (!IS_DEVELOPMENT) {
      return;
    }

    console.log('Service is being killed...');
    // eslint-disable-next-line n/no-process-exit -- Exiting the app is the literal purpose of this method/endpoint
    process.exit(1);
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary:
      'WARNING: Only works in DEBUG-mode. Only used for testing purposes.',
  })
  @ApiExcludeEndpoint(!IS_DEVELOPMENT)
  @Get('validate-indirect-relations')
  validateIndirectRelations(): string[] {
    const missing = this.performExhaustivenessCheck();
    const missingEntries = Object.entries(missing).map(
      ([entity, path]) =>
        `${entity}: [${path.map((p) => `'${p}'`).join(', ')}]`,
    );
    console.log('missingEntries: ', missingEntries);
    return missingEntries;
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
