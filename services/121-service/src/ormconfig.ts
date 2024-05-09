import fs from 'fs';
import { DataSourceOptions } from 'typeorm';

export const ORMConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: !!process.env.POSTGRES_PORT
    ? parseInt(process.env.POSTGRES_PORT)
    : 5432,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DBNAME,
  schema: '121-service',
  entities: ['dist/**/*.entity.js'],
  subscribers: ['dist/**/*.subscriber.js'],
  migrationsTableName: 'custom_migration_table',
  migrations: ['dist/migration/*.js'],
  migrationsRun: false,
  dropSchema: false,
  synchronize: false,
  // UNCOMMENT the following lines to enable query-logging for debugging
  // logging: ['query'],
  // logger: 'advanced-console',
  ssl:
    process.env.NODE_ENV === 'development'
      ? undefined
      : {
          ca: fs.readFileSync('cert/DigiCertGlobalRootCA.crt.pem').toString(),
        },
};
