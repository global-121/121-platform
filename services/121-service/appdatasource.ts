import { ORMConfig } from './ormconfig';
import { DataSource, DataSourceOptions } from 'typeorm';
export const AppDataSource = new DataSource(ORMConfig as DataSourceOptions)

