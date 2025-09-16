import { MigrationInterface, QueryRunner } from 'typeorm';

import { env } from '@121-service/src/env';

export class PhoneNumberPaymentOnafriq1758014323364
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (env.ENV_NAME !== 'DRC') {
      // To test locally change condition
      return;
    }

    // This migration is only relevant for programId 4 and 7
    const programIds = [4, 7];
    const programs = await queryRunner.query(
      `
      SELECT * FROM "121-service".program
      WHERE id = ANY($1)
    `,
      [programIds],
    );

    for (const program of programs) {
      // create program-registration-attribute phoneNumberPayment
      const insertResult = await queryRunner.query(
        `
      INSERT INTO "121-service".program_registration_attribute
        (created, updated, "name", "label", "type", "isRequired", placeholder, "options", scoring, "programId", pattern, "duplicateCheck", "showInPeopleAffectedTable", "editableInPortal", "includeInTransactionExport")
        VALUES(now(), now(), 'phoneNumberPayment', '{"en":"Phone Number for payment"}'::json, 'tel', false, '{"en":"+243000000000"}'::json, NULL, '{}'::json, $1, NULL, false, false, false, true)
        RETURNING id;
    `,
        [program.id],
      );
      const newProgramRegistrationAttributeId = insertResult[0].id;

      // copy registration data from phoneNumber to phoneNumberPayment
      await queryRunner.query(
        `
      INSERT INTO "121-service".registration_attribute_data
        (created, updated, "registrationId", "programRegistrationAttributeId", value)
      SELECT
        NOW() as created,
        NOW() as updated,
        rad."registrationId",
        $1 as "programRegistrationAttributeId",
        rad.value
      FROM "121-service".registration_attribute_data rad
      LEFT JOIN "121-service".program_registration_attribute pra
        ON rad."programRegistrationAttributeId" = pra.id
      WHERE pra.name = 'phoneNumber'
        AND pra."programId" = $2
    `,
        [newProgramRegistrationAttributeId, program.id],
      );
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    'only up';
  }
}
