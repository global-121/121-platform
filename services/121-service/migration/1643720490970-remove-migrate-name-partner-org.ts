import { ProgramCustomAttributeEntity } from './../src/programs/program-custom-attribute.entity';
import { CustomDataAttributes } from './../src/registration/enum/custom-data-attributes';
import {
  Connection,
  IsNull,
  MigrationInterface,
  Not,
  QueryRunner,
} from 'typeorm';
import { RegistrationEntity } from '../src/registration/registration.entity';
import { ProgramEntity } from '../src/programs/program.entity';

export class removeMigrateNamePartnerOrg1643720490970
  implements MigrationInterface {
  name = 'removeMigrateNamePartnerOrg1643720490970';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.migrateData(queryRunner.connection);
    await queryRunner.commitTransaction();
    await queryRunner.startTransaction();
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP COLUMN "namePartnerOrganization"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."whatsapp_pending_message" ADD CONSTRAINT "FK_a7153217f085fbb3a6e30588c4b" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" ADD CONSTRAINT "FK_73c4bbddef1ccb565239e250b59" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" DROP CONSTRAINT "FK_73c4bbddef1ccb565239e250b59"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."whatsapp_pending_message" DROP CONSTRAINT "FK_a7153217f085fbb3a6e30588c4b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD "namePartnerOrganization" character varying`,
    );
  }

  private async migrateData(connection: Connection): Promise<void> {
    const programRepository = connection.getRepository(ProgramEntity);
    const registrationRepository = connection.getRepository(RegistrationEntity);
    const programCustomAttributeRepository = connection.getRepository(
      ProgramCustomAttributeEntity,
    );
    const regsWithPartnerOrg = await registrationRepository.find({
      where: {
        namePartnerOrganization: Not(IsNull()),
      },
    });
    for (const r of regsWithPartnerOrg) {
      r.customData[CustomDataAttributes.namePartnerOrganization] =
        r['namePartnerOrganization'];
      await registrationRepository.save(r);
    }

    const programs = await programRepository.find();
    for (const program of programs) {
      // Than namePartnerOrganisation is part of this programCustomAttributes
      if (regsWithPartnerOrg.length > 0) {
        const attributeReturn = await programCustomAttributeRepository.save({
          name: 'namePartnerOrganization',
          type: 'string',
        });
        program.programCustomAttributes.push(attributeReturn);
        await programRepository.save(program);
      }
    }
  }
}
