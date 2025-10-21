import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateDefaultProgramRegistrationAttributeExport1752231828620
  implements MigrationInterface
{
  name = 'UpdateDefaultProgramRegistrationAttributeExport1752231828620';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" ALTER COLUMN "export" SET DEFAULT '["payment"]'`,
    );

    const programRegistrationAttributes = await queryRunner.query(`
      SELECT id, export
      FROM "121-service"."program_registration_attribute"
    `);

    for (const programCustomAttribute of programRegistrationAttributes) {
      // Remove 'all-registrations' from existing export arrays
      const updatedExport = programCustomAttribute.export.filter(
        (item: any) => item !== 'all-registrations',
      );

      // Replace 'included' with 'payment' if 'payment' is not already present
      const indexOfIncluded = updatedExport.indexOf('included');
      if (indexOfIncluded !== -1) {
        const indexOfPayment = updatedExport.indexOf('payment');
        if (indexOfPayment === -1) {
          updatedExport[indexOfIncluded] = 'payment';
        } else {
          updatedExport.splice(indexOfIncluded, 1);
        }
      }

      await queryRunner.query(
        `
        UPDATE "121-service"."program_registration_attribute"
        SET export = $1
        WHERE id = $2
      `,
        [JSON.stringify(updatedExport), programCustomAttribute.id],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" ALTER COLUMN "export" SET DEFAULT '["all-registrations","included"]'`,
    );
  }
}
