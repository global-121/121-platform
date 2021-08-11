module.exports = {
  type: 'postgres',
  host: '121db',
  port: 5432,
  username: process.env.ORMCONFIG_121_SERVICE_USERNAME,
  password: process.env.ORMCONFIG_121_SERVICE_PASSWORD,
  database: 'global121',
  schema: '121-service',
  entities: ['src/**/**.entity{.ts,.js}'],
  subscribers: ['src/**/**.subscriber{.ts,.js}'],
  migrationsTableName: 'custom_migration_table',
  migrations: ['migration/*.ts'],
  cli: {
    migrationsDir: 'migration',
  },
  dropSchema: false,
  synchronize: true,
};
