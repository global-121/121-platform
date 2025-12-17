import { MigrationInterface, QueryRunner } from 'typeorm';

interface AdminUser {
  id: number;
  username: string;
  admin: boolean;
}

interface Registration {
  id: number;
  registrationStatus: string;
}

export class MigrateStatusesToDeclined1713422095087 implements MigrationInterface {
  name = 'MigrateStatusesToDeclined1713422095087';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Commit transaction because the tables are needed before the insert
    await queryRunner.commitTransaction();
    await this.migrateRegistrationsStatus(queryRunner);
    // Start artificial transaction because TypeORM migrations automatically try to close a transaction after migration
    await queryRunner.startTransaction();
    await queryRunner.query(
      `UPDATE "121-service"."registration"
        SET "registrationStatus" = 'declined'
        WHERE "registrationStatus" IN ('inclusionEnded', 'rejected', 'noLongerEligible')`,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No down migration
  }

  // Function to save event for each registration status change
  private async migrateRegistrationsStatus(
    queryRunner: QueryRunner,
  ): Promise<void> {
    const adminUsers: AdminUser[] = await queryRunner.query(
      `SELECT * FROM "121-service"."user" WHERE admin = true AND username LIKE '%admin%' ORDER BY id LIMIT 1`,
    );

    const registrationsToChange: Registration[] = await queryRunner.query(
      `SELECT * FROM "121-service"."registration" WHERE "registrationStatus" IN ('inclusionEnded', 'rejected', 'noLongerEligible')`,
    );

    const adminUserId = adminUsers[0]?.id || 1;

    await Promise.all(
      registrationsToChange.map(async (registration: Registration) => {
        const insertedId = await queryRunner.query(
          `INSERT INTO "121-service".event(created, updated, "userId", type, "registrationId") VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [
            new Date().toISOString(), // Use the current timestamp in ISO format
            new Date().toISOString(),
            adminUserId,
            'registrationStatusChange',
            registration.id,
          ],
        );

        await queryRunner.query(
          `INSERT INTO "121-service".event_attribute(created, updated, "eventId", key, value) VALUES ($1, $2, $3, $4, $5)`,
          [
            new Date().toISOString(),
            new Date().toISOString(),
            insertedId[0].id,
            'newValue',
            'declined',
          ],
        );

        await queryRunner.query(
          `INSERT INTO "121-service".event_attribute(created, updated, "eventId", key, value) VALUES ($1, $2, $3, $4, $5)`,
          [
            new Date().toISOString(),
            new Date().toISOString(),
            insertedId[0].id,
            'oldValue',
            registration.registrationStatus,
          ],
        );
      }),
    );
  }
}
