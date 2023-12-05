import { Scope } from "@nestjs/common";
import { ScopedRepository } from "../scoped.repository";
import { DataSource } from "typeorm";

// Todo make this strongly typed
export function getScopedRepositoryProvideName(entity: any): string {
  return `ScopedRepository${entity.name}`;
}

// Todo make this strongly typed
export function createScopedRepositoryProvider(entity: any) {
  return {
    provide: getScopedRepositoryProvideName(entity),
    scope: Scope.REQUEST,
    useFactory: (dataSource: DataSource) => {
      return new ScopedRepository(entity, dataSource);
    },
    inject: [DataSource],
  };
}
