import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';

import { ExportType } from '@121-service/src/metrics/enum/export-type.enum';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/program-registration-attribute.entity';

export class RenamePeopleAffected1739294207739 implements MigrationInterface {
  name = 'RenamePeopleAffected1739294207739';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" ALTER COLUMN "export" SET DEFAULT '["all-registrations","included"]'`,
    );
    await this.migrateData(queryRunner.manager);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" ALTER COLUMN "export" SET DEFAULT '["all-people-affected","included"]'`,
    );
  }

  private async migrateData(manager: EntityManager): Promise<void> {
    const oldExportTypeString = 'all-people-affected';
    const newExportTypeString = 'all-registrations';

    const programRegistrationAttributeRepo = manager.getRepository(
      ProgramRegistrationAttributeEntity,
    );
    const programRegistrationAttributes = await programRegistrationAttributeRepo
      .createQueryBuilder('program_registration_attribute')
      .getMany();
    for (const programCustomAttribute of programRegistrationAttributes) {
      const stringArray: string[] = [...programCustomAttribute.export];

      if (!stringArray.includes(oldExportTypeString)) {
        continue;
      }

      stringArray[stringArray.indexOf(oldExportTypeString)] =
        newExportTypeString;

      programCustomAttribute.export = stringArray as ExportType[];
    }

    await programRegistrationAttributeRepo.save(programRegistrationAttributes);
  }
}
