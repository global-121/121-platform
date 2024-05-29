import { ORMConfig } from '@121-service/src/ormconfig';
import { DataSource, DataSourceOptions } from 'typeorm';

const ORMConfigManageMigrations: DataSourceOptions = {
  ...ORMConfig,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migration/*.ts'],
};

export const AppDataSourceManageMigrations = new DataSource(
  ORMConfigManageMigrations,
);
