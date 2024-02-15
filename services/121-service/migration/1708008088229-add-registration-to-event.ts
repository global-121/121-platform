import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRegistrationToEvent1708008088229 implements MigrationInterface {
    name = 'AddRegistrationToEvent1708008088229'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "121-service"."IDX_1da3a2311543c09c5d055448b1"`);
        await queryRunner.query(`ALTER TABLE "121-service"."event" RENAME COLUMN "referenceKey" TO "registrationId"`);
        await queryRunner.query(`ALTER TABLE "121-service"."event" DROP COLUMN "registrationId"`);
        await queryRunner.query(`ALTER TABLE "121-service"."event" ADD "registrationId" integer`);
        await queryRunner.query(`ALTER TABLE "121-service"."event" ADD CONSTRAINT "FK_497c4072a86797298c1c0cf776c" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "121-service"."event" DROP CONSTRAINT "FK_497c4072a86797298c1c0cf776c"`);
        await queryRunner.query(`ALTER TABLE "121-service"."event" DROP COLUMN "registrationId"`);
        await queryRunner.query(`ALTER TABLE "121-service"."event" ADD "registrationId" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "121-service"."event" RENAME COLUMN "registrationId" TO "referenceKey"`);
        await queryRunner.query(`CREATE INDEX "IDX_1da3a2311543c09c5d055448b1" ON "121-service"."event" ("referenceKey") `);
    }

}
