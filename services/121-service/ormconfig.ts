module.exports = {
  type: 'postgres',
  host: process.env.LOCAL_DEVELOPMENT ? 'localhost' : '121db',
  port: process.env.LOCAL_DEVELOPMENT ? 5438 : 5432,
  username: process.env.ORMCONFIG_121_SERVICE_USERNAME,
  password: process.env.ORMCONFIG_121_SERVICE_PASSWORD,
  database: 'global121',
  schema: '121-service',
  entities: ['src/**/**.entity{.ts,.js}'],
  migrationsTableName: 'custom_migration_table',
  migrations: ['migration/*.ts'],
  cli: {
    migrationsDir: 'migration',
  },
  dropSchema: false,
  synchronize: true,
};
