import { MigrationInterface, QueryRunner } from 'typeorm';

import { env } from '@121-service/src/env';

export class AssignAdminUsersToAllPrograms1786100000000
  implements MigrationInterface
{
  name = 'AssignAdminUsersToAllPrograms1786100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (this.isNlrcInstance()) {
      return;
    }

    await this.giveEveryAdminUserAnAssignmentOnEveryProgram({ queryRunner });
    await this.removeNonAdminRolesFromAdminAssignments({ queryRunner });
    await this.grantTheAdminRoleToAdminAssignments({ queryRunner });
  }

  private isNlrcInstance(): boolean {
    return env.ENV_NAME === 'NLRC';
  }

  private async giveEveryAdminUserAnAssignmentOnEveryProgram({
    queryRunner,
  }: {
    queryRunner: QueryRunner;
  }): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "121-service"."program_aidworker_assignment" ("userId", "programId", "scope")
      SELECT admin_user."id", program."id", ''
      FROM "121-service"."user" admin_user
      CROSS JOIN "121-service"."program" program
      WHERE admin_user."admin" = true
        AND NOT EXISTS (
          SELECT 1
          FROM "121-service"."program_aidworker_assignment" existing_assignment
          WHERE existing_assignment."userId" = admin_user."id"
            AND existing_assignment."programId" = program."id"
        );
    `);
  }

  private async removeNonAdminRolesFromAdminAssignments({
    queryRunner,
  }: {
    queryRunner: QueryRunner;
  }): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "121-service"."program_aidworker_assignment_roles_user_role" assignment_role
      USING "121-service"."program_aidworker_assignment" admin_assignment,
            "121-service"."user" admin_user,
            "121-service"."user_role" assigned_role
      WHERE assignment_role."programAidworkerAssignmentId" = admin_assignment."id"
        AND admin_assignment."userId" = admin_user."id"
        AND admin_user."admin" = true
        AND assignment_role."userRoleId" = assigned_role."id"
        AND assigned_role."role" <> 'admin';
    `);
  }

  private async grantTheAdminRoleToAdminAssignments({
    queryRunner,
  }: {
    queryRunner: QueryRunner;
  }): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "121-service"."program_aidworker_assignment_roles_user_role" ("programAidworkerAssignmentId", "userRoleId")
      SELECT admin_assignment."id", admin_role."id"
      FROM "121-service"."program_aidworker_assignment" admin_assignment
      JOIN "121-service"."user" admin_user ON admin_user."id" = admin_assignment."userId"
      CROSS JOIN "121-service"."user_role" admin_role
      WHERE admin_user."admin" = true
        AND admin_role."role" = 'admin'
        AND NOT EXISTS (
          SELECT 1
          FROM "121-service"."program_aidworker_assignment_roles_user_role" existing_role
          WHERE existing_role."programAidworkerAssignmentId" = admin_assignment."id"
            AND existing_role."userRoleId" = admin_role."id"
        );
    `);
  }

  public async down(_: QueryRunner): Promise<void> {
     console.log('Progress is the way');
  }
}
