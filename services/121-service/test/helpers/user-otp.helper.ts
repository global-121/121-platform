import * as request from 'supertest';
import { DataSource } from 'typeorm';

import { ORMConfig } from '@121-service/src/ormconfig';
import { OTP_REISSUE_COOLDOWN_MS } from '@121-service/src/user/user-otp/user-otp.const';
import { getServer } from '@121-service/test/helpers/utility.helper';

export interface StoredUserOtp {
  readonly hash: string;
  readonly issuedAt: Date;
  readonly consumedAt: Date | null;
  readonly failedAttempts: number;
}

export function requestLoginOtp({
  username,
}: {
  username: string;
}): Promise<request.Response> {
  return getServer().post('/users/login/otp').send({ username });
}

export async function connectToDatabase(): Promise<DataSource> {
  const dataSource = new DataSource({
    ...ORMConfig,
    entities: [],
    subscribers: [],
    migrations: [],
  });
  return await dataSource.initialize();
}

export async function getStoredOtps({
  dataSource,
  username,
}: {
  dataSource: DataSource;
  username: string;
}): Promise<StoredUserOtp[]> {
  return await dataSource.query(
    `SELECT otp."hash", otp."issuedAt", otp."consumedAt", otp."failedAttempts"
    FROM "121-service"."user_otp" otp
    JOIN "121-service"."user" u ON u."id" = otp."userId"
    WHERE u."username" = $1`,
    [username],
  );
}

export async function deleteStoredOtps({
  dataSource,
  username,
}: {
  dataSource: DataSource;
  username: string;
}): Promise<void> {
  await dataSource.query(
    `DELETE FROM "121-service"."user_otp"
    WHERE "userId" = (SELECT "id" FROM "121-service"."user" WHERE "username" = $1)`,
    [username],
  );
}

export async function markStoredOtpAsUsedAndIssuedBeforeCooldown({
  dataSource,
  username,
}: {
  dataSource: DataSource;
  username: string;
}): Promise<void> {
  const oneSecondPastCooldownMs = OTP_REISSUE_COOLDOWN_MS + 1_000;
  await dataSource.query(
    `UPDATE "121-service"."user_otp"
    SET "issuedAt" = "issuedAt" - ($2 * interval '1 millisecond'),
      "consumedAt" = now(),
      "failedAttempts" = 3
    WHERE "userId" = (SELECT "id" FROM "121-service"."user" WHERE "username" = $1)`,
    [username, oneSecondPastCooldownMs],
  );
}
