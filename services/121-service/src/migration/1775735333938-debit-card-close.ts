import { MigrationInterface, QueryRunner } from 'typeorm';

export class DebitCardClose1775735333938 implements MigrationInterface {
  name = 'DebitCardClose1775735333938';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Only assign the new permission to admin and program-admin roles
    // There is no reason to add this permission to other roles since it is a intersolve visa specific permission so only relevant in the netherlands

    await queryRunner.query(`
      WITH inserted_permission AS (
        INSERT INTO "121-service"."permission" ("name")
        VALUES ('fsp:debit-card.close')
        RETURNING "id"
      ),
      permission_to_assign AS (
        SELECT "id" FROM inserted_permission
        UNION ALL
        SELECT "id" FROM "121-service"."permission" WHERE "name" = 'fsp:debit-card.close'
        LIMIT 1
      )
      INSERT INTO "121-service"."user_role_permissions_permission" ("userRoleId", "permissionId")
      SELECT ur."id", (SELECT "id" FROM permission_to_assign)
      FROM "121-service"."user_role" ur
      WHERE ur."role" IN ('admin', 'program-admin')
    `);

    await queryRunner.query(
      `CREATE TABLE "121-service"."intersolve_visa_wallet_closure" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "intersolveVisaChildWalletId" integer NOT NULL, "amountBookedBackInCents" integer NOT NULL, CONSTRAINT "REL_211d0fbad2e3b228f13ebd8c88" UNIQUE ("intersolveVisaChildWalletId"), CONSTRAINT "PK_edc3f867b0ce0427217d3f9efbb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1029bced39fa9f2875a4bb26db" ON "121-service"."intersolve_visa_wallet_closure" ("created") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_visa_wallet_closure" ADD CONSTRAINT "FK_211d0fbad2e3b228f13ebd8c88e" FOREIGN KEY ("intersolveVisaChildWalletId") REFERENCES "121-service"."intersolve_visa_child_wallet"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(_: QueryRunner): Promise<void> {
    console.log('never down');
  }
}
