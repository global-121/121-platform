import { Provider, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { DataSource } from 'typeorm';
import { ScopedRepository } from '../../scoped.repository';

// Todo make this strongly typed
export function getScopedRepositoryProviderName(entity: any): string {
  return `ScopedRepository${entity.name}`;
}

// Todo make this strongly typed
export function createScopedRepositoryProvider(entity: any): Provider<any> {
  return {
    provide: getScopedRepositoryProviderName(entity),
    scope: Scope.REQUEST,
    useFactory: (dataSource: DataSource, request: Request) => {
      return new ScopedRepository(entity, dataSource, request);
    },
    durable: true,
    inject: [DataSource, REQUEST],
  };
}
