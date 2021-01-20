module.exports = {
  type: 'postgres',
  host: process.env.LOCAL_DEVELOPMENT ? '121db' : 'localhost',
  port: process.env.LOCAL_DEVELOPMENT ? 5432 : 5438,
  username: process.env.ORMCONFIG_PA_ACCOUNTS_SERVICE_USERNAME,
  password: process.env.ORMCONFIG_PA_ACCOUNTS_SERVICE_PASSWORD,
  database: 'global121',
  schema: 'pa-accounts',
  entities: ['src/**/**.entity{.ts,.js}'],
  migrationsTableName: 'custom_migration_table',
  migrations: ['migration/*.ts'],
  cli: {
    migrationsDir: 'migration',
  },
  dropSchema: false,
  synchronize: true,
};
