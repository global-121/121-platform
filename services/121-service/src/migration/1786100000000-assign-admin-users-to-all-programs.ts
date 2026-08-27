import { MigrationInterface, QueryRunner } from 'typeorm';

import { env } from '@121-service/src/env';

export class AssignAdminUsersToAllPrograms1786100000000
  implements MigrationInterface
{
  name = 'AssignAdminUsersToAllPrograms1786100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (env.ENV_NAME === 'NLRC') {
      return;
    }

    // Create an assignment for every admin user on every program that does not have one yet.
    await queryRunner.query(`
      INSERT INTO "121-service"."program_aidworker_assignment" ("userId", "programId", "scope")
      SELECT u."id", p."id", ''
      FROM "121-service"."user" u
      CROSS JOIN "121-service"."program" p
      WHERE u."admin" = true
        AND NOT EXISTS (
          SELECT 1 FROM "121-service"."program_aidworker_assignment" paa
          WHERE paa."userId" = u."id" AND paa."programId" = p."id"
        );
    `);

    // Assign the admin role to every admin user's assignment that does not have it yet.
    await queryRunner.query(`
      INSERT INTO "121-service"."program_aidworker_assignment_roles_user_role" ("programAidworkerAssignmentId", "userRoleId")
      SELECT paa."id", ur."id"
      FROM "121-service"."program_aidworker_assignment" paa
      JOIN "121-service"."user" u ON u."id" = paa."userId"
      CROSS JOIN "121-service"."user_role" ur
      WHERE u."admin" = true
        AND ur."role" = 'admin'
        AND NOT EXISTS (
          SELECT 1 FROM "121-service"."program_aidworker_assignment_roles_user_role" paarur
          WHERE paarur."programAidworkerAssignmentId" = paa."id"
            AND paarur."userRoleId" = ur."id"
        );
    `);
  }

  public async down(_: QueryRunner): Promise<void> {
     console.log('Progress is the way');
  }
}
