import { Provider, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { ScopedRepository } from '../../scoped.repository';
import { ScopedUserRequest } from '../../shared/scoped-user-request';

// Todo make this strongly typed
export function getScopedRepositoryProviderName(entity: any): string {
  return `ScopedRepository${entity.name}`;
}

// Todo make this strongly typed
export function createScopedRepositoryProvider(entity: any): Provider<any> {
  return {
    provide: getScopedRepositoryProviderName(entity),
    scope: Scope.REQUEST,
    useFactory: (dataSource: DataSource, request: ScopedUserRequest) => {
      return new ScopedRepository(entity, dataSource, request);
    },
    durable: true,
    inject: [DataSource, REQUEST],
  };
}
