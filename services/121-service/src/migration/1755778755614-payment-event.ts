import { MigrationInterface, QueryRunner } from 'typeorm';

export class PaymentEvent1755778755614 implements MigrationInterface {
  name = 'PaymentEvent1755778755614';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."payment_event_attribute" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "eventId" integer NOT NULL, "key" character varying NOT NULL, "value" character varying, CONSTRAINT "PK_51de998993f371fc3775c58d02a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_91641947e58663bff120b5f2db" ON "121-service"."payment_event_attribute" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6601246e05ca01ad37469aa4d7" ON "121-service"."payment_event_attribute" ("key") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."payment_event" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, "type" character varying NOT NULL, "paymentId" integer NOT NULL, CONSTRAINT "PK_7e4a9d66fdf160a9fb9d236150f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f8f8fabc6fa41ba8e24b6bf765" ON "121-service"."payment_event" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3422e6387636e8a9e3dea71f55" ON "121-service"."payment_event" ("type") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_event_attribute" ADD CONSTRAINT "FK_e28d79f5ba52342f108cc7cb499" FOREIGN KEY ("eventId") REFERENCES "121-service"."payment_event"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_event" ADD CONSTRAINT "FK_62a0ee83009b219a9dd2fe3ec78" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_event" ADD CONSTRAINT "FK_f602a2c38d32fc188d889087adc" FOREIGN KEY ("paymentId") REFERENCES "121-service"."payment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // Fill each payment with a created event
    // First, select the data to verify what will be inserted
    const paymentsToMigrate = await queryRunner.query(
      `SELECT DISTINCT
         payment.id as "paymentId",
         payment.created,
         transaction."userId"
       FROM "121-service"."payment" payment
       INNER JOIN "121-service"."transaction" transaction ON transaction."paymentId" = payment.id
       ORDER BY payment.id`,
    );

    for (const payment of paymentsToMigrate) {
      await queryRunner.query(
        `INSERT INTO "121-service"."payment_event" ("created", "userId", "type", "paymentId")
         VALUES ($1, $2, 'created', $3)`,
        [payment.created, payment.userId, payment.paymentId],
      );
    }
  }

  public async down(_: QueryRunner): Promise<void> {
    console.log('Always up, never down');
  }
}
