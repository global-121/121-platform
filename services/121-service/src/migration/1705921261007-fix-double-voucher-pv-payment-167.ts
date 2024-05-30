import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixDoubleVoucherPvPayment1671705921261007
  implements MigrationInterface
{
  public async up(_queryRunner: QueryRunner): Promise<void> {
    // The code in this migration should be removed after it has run
    // console.time('FixDoubleVoucherPvPayment1671705921261007');
    // const instances = await queryRunner.query(`
    //   select
    //     id
    //   from
    //     "121-service"."instance"
    //   where
    //     name = 'NLRC';`);
    // if (instances.length > 0) {
    //   // The subselect ensures that only registrations with more than 1 voucher are selected
    //   // that have their transaction 168 set to completed
    //   const transactionIdsThatNeedToBeUpdated = await queryRunner.query(
    //     `
    //     select
    //       max(t.id) as id
    //     from
    //     "121-service"."transaction" t
    //     left join "121-service".registration r on
    //       t."registrationId" = r.id
    //     where
    //       t.payment = 167 and
    //       r.id in (
    //         select
    //           r.id as id
    //         from
    //         "121-service".intersolve_voucher iv
    //         left join "121-service".imagecode_export_vouchers iev on
    //           iv.id = iev."voucherId"
    //         left join "121-service".registration r on
    //           iev."registrationId" = r.id
    //         where
    //           iv.payment = 167
    //         group by
    //           r.id
    //         having
    //           count(iv.id) > 1
    //           order by r.id
    //       )
    //   group by
    //     r.id, t."transactionStep"
    //   having
    //     count(t.id) > 1
    //     `,
    //   );
    //   console.log(
    //     '🚀 ~ up ~ transactionIdsThatNeedToBeUpdated:',
    //     transactionIdsThatNeedToBeUpdated,
    //   );
    //   if (transactionIdsThatNeedToBeUpdated.length > 0) {
    //     await queryRunner.query(`
    //     update
    //     "121-service"."transaction"
    //     set
    //       payment = 168
    //     where
    //       id in (${transactionIdsThatNeedToBeUpdated.map((t) => t.id)})`);
    //   }
    //   const intersolveVoucherIdsThatNeedUpdate = await queryRunner.query(`
    //     select
    //       max(iv.id) as id
    //     from
    //     "121-service".intersolve_voucher iv
    //     left join "121-service".imagecode_export_vouchers iev on
    //       iv.id = iev."voucherId"
    //     left join "121-service".registration r on
    //       iev."registrationId" = r.id
    //     where
    //       iv.payment = 167
    //     group by
    //       r.id
    //     having
    //       count(iv.id) > 1`);
    //   console.log(
    //     '🚀 ~ up ~ intersolveVoucherIdsThatNeedUpdate:',
    //     intersolveVoucherIdsThatNeedUpdate,
    //   );
    //   if (intersolveVoucherIdsThatNeedUpdate.length > 0) {
    //     await queryRunner.query(`
    //     update
    //     "121-service".intersolve_voucher
    //     set
    //       payment = 168
    //     where
    //       id in (${intersolveVoucherIdsThatNeedUpdate.map((t) => t.id)})`);
    //   }
    //   await queryRunner.query(`TRUNCATE "121-service"."latest_transaction"`);
    //   await queryRunner.query(`
    //       INSERT INTO "121-service"."latest_transaction" ("payment", "registrationId", "transactionId")
    //       SELECT t.payment, t."registrationId", t.id AS transactionId
    //       FROM (
    //           SELECT payment, "registrationId", MAX(created) AS max_created
    //           FROM "121-service"."transaction"
    //           GROUP BY payment, "registrationId"
    //       ) AS latest_transactions
    //       INNER JOIN "121-service"."transaction" AS t
    //           ON t.payment = latest_transactions.payment
    //           AND t."registrationId" = latest_transactions."registrationId"
    //           AND t.created = latest_transactions.max_created;`);
    // }
    // console.timeEnd('FixDoubleVoucherPvPayment1671705921261007');
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No down migration
  }
}
