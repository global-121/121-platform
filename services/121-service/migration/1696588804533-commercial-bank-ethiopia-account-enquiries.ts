import { MigrationInterface, QueryRunner } from 'typeorm';

export class commercialBankEthiopiaAccountEnquiries1696588804533
  implements MigrationInterface
{
  name = 'commercialBankEthiopiaAccountEnquiries1696588804533';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."commercial-bank-ethiopia-account-enquiries" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "registrationId" integer, "fullNameUsedForTheMatch" character varying, "bankAccountNumberUsedForCall" character varying, "cbeName" character varying, "namesMatch" boolean, "cbeStatus" character varying, "errorMessage" character varying, CONSTRAINT "REL_718c48c84b802de3cf219e2fc1" UNIQUE ("registrationId"), CONSTRAINT "PK_b4186313bb7e94ba1b687f1c3e6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6634d98139a8fc61021f189dd7" ON "121-service"."commercial-bank-ethiopia-account-enquiries" ("created") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."commercial-bank-ethiopia-account-enquiries" ADD CONSTRAINT "FK_718c48c84b802de3cf219e2fc1d" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."commercial-bank-ethiopia-account-enquiries" DROP CONSTRAINT "FK_718c48c84b802de3cf219e2fc1d"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_6634d98139a8fc61021f189dd7"`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."commercial-bank-ethiopia-account-enquiries"`,
    );
  }
}
