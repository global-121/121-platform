import { MigrationInterface, QueryRunner } from 'typeorm';

export class DebitCardOrderCreate1779500000000 implements MigrationInterface {
  name = 'DebitCardOrderCreate1779500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Not assigning this permission to a role by default.
    // Support can grant this when the feature is enabled per instance.
    await queryRunner.query(`
      INSERT INTO "121-service"."permission" ("name")
      VALUES ('fsp:debit-card.order.create')
      ON CONFLICT ("name") DO NOTHING
    `);

    await queryRunner.query(
      `CREATE TABLE "121-service"."intersolve_visa_card_order" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "programId" integer NOT NULL, "userId" integer NOT NULL, "noOfCards" integer NOT NULL, "noOfCardsOrdered" integer NOT NULL, "addressee" character varying NOT NULL, "address" character varying NOT NULL, "city" character varying NOT NULL, "postalCode" character varying NOT NULL, CONSTRAINT "PK_74f3e6e9391744a9547c2f8a7f6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e84448bf7f21184160feebf2c9" ON "121-service"."intersolve_visa_card_order" ("programId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b13f985c5de734c9b0112630bb" ON "121-service"."intersolve_visa_card_order" ("created") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_card_order" ADD CONSTRAINT "FK_8f955bc354411524b3f003677b8" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(_: QueryRunner): Promise<void> {
    console.log('never down');
  }
}
