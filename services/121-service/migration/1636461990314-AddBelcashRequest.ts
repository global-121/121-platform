import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBelcashRequest1636461990314 implements MigrationInterface {
  name = 'AddBelcashRequest1636461990314';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."belcash-request" ("belcashRequestId" SERIAL NOT NULL, "from" character varying NOT NULL, "fromname" character varying NOT NULL, "fromaccount" character varying NOT NULL, "to" character varying NOT NULL, "toname" character varying NOT NULL, "toaccount" character varying NOT NULL, "amount" integer NOT NULL, "fee" integer NOT NULL, "currency" character varying NOT NULL, "description" character varying NOT NULL, "statusdetail" character varying NOT NULL, "id" character varying, "date" character varying, "processdate" character varying, "statuscomment" character varying, "status" character varying NOT NULL, "referenceid" character varying, "tracenumber" character varying, "system" character varying NOT NULL, CONSTRAINT "PK_dba96a2c8977413d6ac45272b38" PRIMARY KEY ("belcashRequestId"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "121-service"."belcash-request"`);
  }
}
