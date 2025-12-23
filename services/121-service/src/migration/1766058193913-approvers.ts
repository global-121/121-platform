import { MigrationInterface, QueryRunner } from 'typeorm';

export class Approvers1766058193913 implements MigrationInterface {
  name = 'Approvers1766058193913';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."approver" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "programAidworkerAssignmentId" integer NOT NULL, "order" integer NOT NULL, CONSTRAINT "REL_58ca3f250fb902accdafddd724" UNIQUE ("programAidworkerAssignmentId"), CONSTRAINT "PK_760049de241c526dbfd1330f6dd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_845370013478fda958aaecdec5" ON "121-service"."approver" ("created") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."payment_approval" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "approverId" integer NOT NULL, "paymentId" integer NOT NULL, "approved" boolean NOT NULL, "order" integer NOT NULL, CONSTRAINT "PK_be16f8bd8909467e8b9fcdbfc68" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fb65e9abf4abdce1c3b35858da" ON "121-service"."payment_approval" ("created") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."approver" ADD CONSTRAINT "FK_58ca3f250fb902accdafddd724b" FOREIGN KEY ("programAidworkerAssignmentId") REFERENCES "121-service"."program_aidworker_assignment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_approval" ADD CONSTRAINT "FK_ea4575af43b630e6d37b3d4feff" FOREIGN KEY ("approverId") REFERENCES "121-service"."approver"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_approval" ADD CONSTRAINT "FK_489750b2f9e0c35193c674302da" FOREIGN KEY ("paymentId") REFERENCES "121-service"."payment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // no down
  }
}
