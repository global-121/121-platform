import { readFileSync } from 'node:fs';
import { TlsOptions } from 'node:tls';
import { DataSourceOptions } from 'typeorm';

import { IS_DEVELOPMENT } from '@121-service/src/config';
import { env } from '@121-service/src/env';

const createSSLConfig = (): boolean | TlsOptions => {
  if (IS_DEVELOPMENT) {
    // In local development, no SSL-connection is needed
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
  host: env.POSTGRES_HOST,
  port: env.POSTGRES_PORT,
  username: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
  database: env.POSTGRES_DBNAME,
  schema: env.POSTGRES_SCHEMA,
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
