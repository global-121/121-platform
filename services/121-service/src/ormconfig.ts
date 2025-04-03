import { readFileSync } from 'node:fs';
import { TlsOptions } from 'node:tls';
import { DataSourceOptions } from 'typeorm';

const createSSLConfig = (): boolean | TlsOptions => {
  if (process.env.NODE_ENV === 'development') {
    return false;
  }
  // To make a secure connection to an "Azure Database for PostgreSQL flexible server" in local development:
  // - See: https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/concepts-networking-ssl-tls#configure-ssl-on-the-client
  // - Download the 3 certificates mentioned (or extract them from an App Service instance) into the local `./cert`-folder,
  // - Set: certsPath to: './cert'
  // - Disable the NODE_ENV check above, or set the ENV-variable to 'production' in the `services/.env`-file
  const certsPath = '/etc/ssl/certs';
  const azureConnectionCACertificates = [
    readFileSync(`${certsPath}/DigiCert_Global_Root_CA.pem`).toString(),
    readFileSync(
      `${certsPath}/Microsoft_RSA_Root_Certificate_Authority_2017.pem`,
    ).toString(),
    readFileSync(`${certsPath}/DigiCert_Global_Root_G2.pem`).toString(),
  ].join('\n\n');

  return {
    ca: azureConnectionCACertificates,
  };
};

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
  ssl: createSSLConfig(),
};
