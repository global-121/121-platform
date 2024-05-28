import { ORMConfig } from '@121-service/src/ormconfig';
import { DataSource, DataSourceOptions } from 'typeorm';
export const AppDataSource = new DataSource(ORMConfig as DataSourceOptions);
