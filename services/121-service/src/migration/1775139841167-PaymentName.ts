import { MigrationInterface, QueryRunner } from 'typeorm';

import { env } from '@121-service/src/env';

export class PaymentName1775139841167 implements MigrationInterface {
  name = 'PaymentName1775139841167';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add the new column initially as nullable
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment" ADD "name" character varying`,
    );

    // Fetch all existing payments to update their names
    const payments = await queryRunner.query(
      `SELECT id, created FROM "121-service"."payment"`,
    );

    const environmentName = (env.ENV_NAME ?? '').trim().toUpperCase();

    const formatterConfigs: Record<string, { locale: string; paymentWord: string }> = {
      UK: { locale: 'en-GB', paymentWord: 'Payment' },
      BENIN: { locale: 'fr', paymentWord: 'Paiement' },
      CHAD: { locale: 'fr', paymentWord: 'Paiement' },
      DRC: { locale: 'fr', paymentWord: 'Paiement' },
      IVORY_COAST: { locale: 'fr', paymentWord: 'Paiement' },
      MAURITANIA: { locale: 'fr', paymentWord: 'Paiement' },
      TOGO: { locale: 'fr', paymentWord: 'Paiement' },
    };

    const formatterConfig =
      formatterConfigs[environmentName.replaceAll(' ', '_')] ?? {
        locale: 'en-GB',
        paymentWord: 'Payment',
      };

    // Use locale-based date/time formatting without fixed time zone.
    const formatter = new Intl.DateTimeFormat(formatterConfig.locale, {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    // Loop over and update each existing payment
    for (const payment of payments) {
      const date = new Date(payment.created);

      // Use locale-native ordering/separators and normalize unicode spaces.
      const formattedDate = formatter
        .format(date)
        .replace(/[\u00A0\u202F]/g, ' ')
        .trim();
      const paymentName = `${formatterConfig.paymentWord} ${formattedDate}`;

      await queryRunner.query(
        `UPDATE "121-service"."payment" SET "name" = $1 WHERE id = $2`,
        [paymentName, payment.id],
      );
    }

    // Enforce non-null constraint now that all records have names
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment" ALTER COLUMN "name" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment" DROP COLUMN "name"`,
    );
  }
}
