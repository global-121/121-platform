import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProgramAidworkerAssignmentAccessGroups1791195030897 implements MigrationInterface {
  name = 'ProgramAidworkerAssignmentAccessGroups1791195030897';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."program_aidworker_assignment_access_group" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "programAidworkerAssignmentId" integer NOT NULL, "accessGroupLevelId" integer NOT NULL, "value" character varying NOT NULL, CONSTRAINT "programAidworkerAssignmentAccessGroupUnique" UNIQUE ("programAidworkerAssignmentId", "accessGroupLevelId"), CONSTRAINT "PK_bb91bc3c79eac5ade84df1b23ed" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1e5127e69ab3a719430fbf5aed" ON "121-service"."program_aidworker_assignment_access_group" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_program_aidworker_assignment_access_group_levelId" ON "121-service"."program_aidworker_assignment_access_group" ("accessGroupLevelId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_aidworker_assignment_access_group" ADD CONSTRAINT "FK_b5f96e9c3f8484c491047127063" FOREIGN KEY ("programAidworkerAssignmentId") REFERENCES "121-service"."program_aidworker_assignment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_aidworker_assignment_access_group" ADD CONSTRAINT "FK_38f906175a988d5c8da0d7752bd" FOREIGN KEY ("accessGroupLevelId") REFERENCES "121-service"."program_access_group_level"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(_: QueryRunner): Promise<void> {
    console.log('no down migration');
  }
}
