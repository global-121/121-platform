import { Provider, Scope } from '@nestjs/common';
import { ScopedRepository } from '../scoped.repository';
import { DataSource } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

// Todo make this strongly typed
export function getScopedRepositoryProvideName(entity: any): string {
  return `ScopedRepository${entity.name}`;
}

// Todo make this strongly typed
export function createScopedRepositoryProvider(entity: any): Provider<any> {
  return {
    provide: getScopedRepositoryProvideName(entity),
    scope: Scope.REQUEST,
    useFactory: (dataSource: DataSource, request: Request) => {
      return new ScopedRepository(entity, dataSource, request);
    },
    durable: true,
    inject: [DataSource, REQUEST],
  };
}
