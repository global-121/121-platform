import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReassignAdminRoleToProgramAdmin1795174244545
  implements MigrationInterface
{
  name = 'ReassignAdminRoleToProgramAdmin1795174244545';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM "121-service"."program_aidworker_assignment_roles_user_role" assignment_role
          JOIN "121-service"."user_role" admin_role
            ON admin_role."id" = assignment_role."userRoleId"
          WHERE admin_role."role" = 'admin'
        ) AND NOT EXISTS (
          SELECT 1
          FROM "121-service"."user_role"
          WHERE "role" = 'program-admin'
        ) THEN
          RAISE EXCEPTION 'Cannot reassign admin role: program-admin role does not exist';
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      INSERT INTO "121-service"."program_aidworker_assignment_roles_user_role"
        ("programAidworkerAssignmentId", "userRoleId")
      SELECT admin_assignment_role."programAidworkerAssignmentId", program_admin_role."id"
      FROM "121-service"."program_aidworker_assignment_roles_user_role" admin_assignment_role
      JOIN "121-service"."user_role" admin_role
        ON admin_role."id" = admin_assignment_role."userRoleId"
      CROSS JOIN "121-service"."user_role" program_admin_role
      WHERE admin_role."role" = 'admin'
        AND program_admin_role."role" = 'program-admin'
      ON CONFLICT ("programAidworkerAssignmentId", "userRoleId") DO NOTHING;
    `);

    await queryRunner.query(`
      DELETE FROM "121-service"."program_aidworker_assignment_roles_user_role" assignment_role
      USING "121-service"."user_role" admin_role
      WHERE admin_role."id" = assignment_role."userRoleId"
        AND admin_role."role" = 'admin';
    `);
  }

  public down(): Promise<void> {
    return Promise.resolve();
  }
}