import { DataSource, DataSourceOptions } from 'typeorm';
import { ORMConfig } from './ormconfig';
export const AppDataSource = new DataSource(ORMConfig as DataSourceOptions);
