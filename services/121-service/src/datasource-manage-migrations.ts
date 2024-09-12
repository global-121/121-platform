// This file is only used to check/generate migrations manually from the scripts in package.json
// It is not used by the application in runtime. The application uses appdatasource.ts.
import { DataSource, DataSourceOptions } from 'typeorm';

import { ORMConfig } from '@121-service/src/ormconfig';

const ORMConfigManageMigrations: DataSourceOptions = {
  ...ORMConfig,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migration/*.ts'],
};

export const AppDataSourceManageMigrations = new DataSource(
  ORMConfigManageMigrations,
);
