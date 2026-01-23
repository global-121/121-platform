import { MigrationInterface, QueryRunner } from 'typeorm';

export class Approvers1766058193913 implements MigrationInterface {
  name = 'Approvers1766058193913';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Datamodel migration
    await queryRunner.query(
      `CREATE TABLE "121-service"."approver" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "programAidworkerAssignmentId" integer, "order" integer NOT NULL, "isActive" boolean NOT NULL, CONSTRAINT "REL_58ca3f250fb902accdafddd724" UNIQUE ("programAidworkerAssignmentId"), CONSTRAINT "PK_760049de241c526dbfd1330f6dd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_845370013478fda958aaecdec5" ON "121-service"."approver" ("created") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."payment_approval" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "approverId" integer NOT NULL, "paymentId" integer NOT NULL, "approved" boolean NOT NULL, "rank" integer NOT NULL, CONSTRAINT "PK_be16f8bd8909467e8b9fcdbfc68" PRIMARY KEY ("id"))`,
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

    // Data migration
    await this.migrateApprovers(queryRunner);
    await this.migratePaymentApprovals(queryRunner);
    await this.migrateAttributesOfApprovedPaymentEvents(queryRunner);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // no down
  }

  private async migrateApprovers(queryRunner: QueryRunner) {
    const assignmentsWithPaymentStartPermission = await queryRunner.query(
      `SELECT p.id AS "programId", paa.id AS "programAidworkerAssignmentId"
      FROM "121-service"."program" p
      JOIN "121-service"."program_aidworker_assignment" paa ON paa."programId" = p.id
      JOIN "121-service"."program_aidworker_assignment_roles_user_role" paarur ON paarur."programAidworkerAssignmentId" = paa.id
      JOIN "121-service"."user_role_permissions_permission" urpp ON urpp."userRoleId" = paarur."userRoleId"
      JOIN "121-service"."permission" perm ON perm.id = urpp."permissionId"
      JOIN "121-service"."user_role" ur ON ur.id = paarur."userRoleId"
      WHERE perm.name = 'payment.start'
      AND ur.role <> 'admin'
      AND paa.scope = ''
      ORDER BY paa.id`,
    );

    const approverInserts: string[] = [];
    const programApproverCount: Record<number, number> = {};
    assignmentsWithPaymentStartPermission.forEach(
      (row: { programId: number; programAidworkerAssignmentId: number }) => {
        const { programId, programAidworkerAssignmentId } = row;
        if (!programApproverCount[programId]) {
          programApproverCount[programId] = 0;
        }
        programApproverCount[programId]++;
        approverInserts.push(
          `(${programAidworkerAssignmentId}, ${programApproverCount[programId]})`,
        );
      },
    );

    if (approverInserts.length > 0) {
      await queryRunner.query(
        `INSERT INTO "121-service"."approver" ("programAidworkerAssignmentId", "order") VALUES ${approverInserts.join(', ')}`,
      );
    }
  }

  private async migratePaymentApprovals(queryRunner: QueryRunner) {
    const paymentsPendingApproval = await queryRunner.query(
      `SELECT DISTINCT p.id AS "paymentId", p."programId"
      FROM "121-service"."payment" p
      JOIN "121-service"."transaction" t ON t."paymentId" = p.id
      WHERE t.status = 'pendingApproval'`,
    );

    const paymentApprovalInserts: string[] = [];
    for (const payment of paymentsPendingApproval) {
      const { paymentId, programId } = payment;
      const approvers = await queryRunner.query(
        `SELECT a.id AS "approverId", a."order"
        FROM "121-service"."approver" a
        WHERE a."programAidworkerAssignmentId" IN (
          SELECT paa.id
          FROM "121-service"."program_aidworker_assignment" paa
          WHERE paa."programId" = $1
        )
        ORDER BY a."order"`,
        [programId],
      );

      approvers.forEach((approver: { approverId: number; order: number }) => {
        const { approverId, order } = approver;
        paymentApprovalInserts.push(
          `(${approverId}, ${paymentId}, false, ${order})`,
        );
      });
    }

    if (paymentApprovalInserts.length > 0) {
      await queryRunner.query(
        `INSERT INTO "121-service"."payment_approval" ("approverId", "paymentId", "approved", "rank") VALUES ${paymentApprovalInserts.join(
          ', ',
        )}`,
      );
    }
  }

  private async migrateAttributesOfApprovedPaymentEvents(
    queryRunner: QueryRunner,
  ) {
    const approvedPaymentEvents = await queryRunner.query(
      `SELECT *
      FROM "121-service"."payment_event"
      WHERE type = 'approved'`,
    );

    for (const event of approvedPaymentEvents) {
      await queryRunner.query(
        `INSERT INTO "121-service".payment_event_attribute
        (created, updated, "eventId", "key", value)
        VALUES($1, $1, $2, 'approveRank', '1')`,
        [event.created, event.id],
      );
      await queryRunner.query(
        `INSERT INTO "121-service".payment_event_attribute
        (created, updated, "eventId", "key", value)
        VALUES($1, $1, $2, 'approveTotal', '1')`,
        [event.created, event.id],
      );
    }
  }
}
