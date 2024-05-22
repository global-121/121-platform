import { ORMConfig } from '@121-service/ormconfig';
import { DataSource, DataSourceOptions } from 'typeorm';
export const AppDataSource = new DataSource(ORMConfig as DataSourceOptions);
