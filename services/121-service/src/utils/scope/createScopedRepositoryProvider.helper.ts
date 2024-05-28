import { ScopedRepository } from '@121-service/src/scoped.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';
import { Provider, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { DataSource, ObjectLiteral } from 'typeorm';

// Todo make this strongly typed
export function getScopedRepositoryProviderName(entity: any): string {
  return `ScopedRepository${entity.name}`;
}

export function createScopedRepositoryProvider<T extends ObjectLiteral>(
  entity: new () => T,
): Provider<ScopedRepository<T>> {
  return {
    provide: getScopedRepositoryProviderName(entity),
    scope: Scope.REQUEST,
    useFactory: (dataSource: DataSource, request: ScopedUserRequest) => {
      const repository = dataSource.getRepository(entity);
      return new ScopedRepository(request, repository);
    },
    durable: true,
    inject: [DataSource, REQUEST],
  };
}
