import { MigrationInterface, QueryRunner } from "typeorm";

export class visaCustomer1676570780561 implements MigrationInterface {
    name = 'visaCustomer1676570780561'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."intersolve_visa_card" DROP CONSTRAINT "FK_c990ae558463cd0116cf6dc3e86"`);
        await queryRunner.query(`CREATE TABLE "121-service"."intersolve_visa_customer" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "blocked" boolean, "holderId" character varying, "registrationId" integer, "visaCardId" integer, CONSTRAINT "REL_ad00c730226a462624de94041e" UNIQUE ("registrationId"), CONSTRAINT "REL_70d1231a6094f1151ec92303a8" UNIQUE ("visaCardId"), CONSTRAINT "PK_4e102a56ae70e53cfbfbe428d93" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_76c1670fcb023cd7c2ce88c9b1" ON "121-service"."intersolve_visa_customer" ("created") `);
        await queryRunner.query(`CREATE INDEX "IDX_515c96e866cf596a8ceff97330" ON "121-service"."intersolve_visa_customer" ("holderId") `);
        await queryRunner.query(`ALTER TABLE "121-service"."intersolve_visa_card" DROP CONSTRAINT "REL_c990ae558463cd0116cf6dc3e8"`);
        await queryRunner.query(`ALTER TABLE "121-service"."intersolve_visa_card" DROP COLUMN "registrationId"`);
        await queryRunner.query(`ALTER TABLE "121-service"."intersolve_visa_customer" ADD CONSTRAINT "FK_ad00c730226a462624de94041ec" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "121-service"."intersolve_visa_customer" ADD CONSTRAINT "FK_70d1231a6094f1151ec92303a83" FOREIGN KEY ("visaCardId") REFERENCES "121-service"."intersolve_visa_card"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."intersolve_visa_customer" DROP CONSTRAINT "FK_70d1231a6094f1151ec92303a83"`);
        await queryRunner.query(`ALTER TABLE "121-service"."intersolve_visa_customer" DROP CONSTRAINT "FK_ad00c730226a462624de94041ec"`);
        await queryRunner.query(`ALTER TABLE "121-service"."intersolve_visa_card" ADD "registrationId" integer`);
        await queryRunner.query(`ALTER TABLE "121-service"."intersolve_visa_card" ADD CONSTRAINT "REL_c990ae558463cd0116cf6dc3e8" UNIQUE ("registrationId")`);
        await queryRunner.query(`DROP INDEX "121-service"."IDX_515c96e866cf596a8ceff97330"`);
        await queryRunner.query(`DROP INDEX "121-service"."IDX_76c1670fcb023cd7c2ce88c9b1"`);
        await queryRunner.query(`DROP TABLE "121-service"."intersolve_visa_customer"`);
        await queryRunner.query(`ALTER TABLE "121-service"."intersolve_visa_card" ADD CONSTRAINT "FK_c990ae558463cd0116cf6dc3e86" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
