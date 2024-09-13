import { DataSource, DataSourceOptions } from 'typeorm';

import { ORMConfig } from '@121-service/src/ormconfig';
export const AppDataSource = new DataSource(ORMConfig as DataSourceOptions);
